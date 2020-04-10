using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Discord.WebSocket;
using Microsoft.EntityFrameworkCore;
using RaceAnnouncer.Bot.Adapters;
using RaceAnnouncer.Bot.Util;
using RaceAnnouncer.Bot.Data;
using RaceAnnouncer.Bot.Data.Controllers;
using RaceAnnouncer.Bot.Services;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Schema.Models;
using RaceAnnouncer.Common;

namespace RaceAnnouncer.Bot
{
  internal static class Program
  {
    private static readonly SemaphoreSlim _contextSemaphore = new SemaphoreSlim(1, 1);
    private static bool _isInitialLoad = true;

    #region Queues

    /// <summary>
    /// Queue of added channels
    /// </summary>
    private static readonly ConcurrentQueue<SocketTextChannel>
      _queueAddedChannels = new ConcurrentQueue<SocketTextChannel>();

    /// <summary>
    /// Queue of deleted channels
    /// </summary>
    private static readonly ConcurrentQueue<SocketTextChannel>
      _queueDeletedChannels = new ConcurrentQueue<SocketTextChannel>();

    /// <summary>
    /// Queue of deleted guilds
    /// </summary>
    private static readonly ConcurrentQueue<SocketGuild>
      _queueDeletedGuilds = new ConcurrentQueue<SocketGuild>();

    #endregion Queues

    #region Services

    /// <summary>
    /// Discord Service
    /// </summary>
    private static DiscordService _discordService = null!;

    /// <summary>
    /// SpeedRunsLive Service
    /// </summary>
    private static SRLService _srlService = null!;

    #endregion Services

    /// <summary>
    /// Entry point
    /// </summary>
    internal static void Main()
    {
      AppDomain.CurrentDomain.ProcessExit += _Shutdown;

      Logger.Debug("Initializing Database");
      MigrateDatabase();

      Logger.Debug("Initializing SRL Service");
      InitSrlService();

      Logger.Debug("Initializing Discord Service");
      InitDiscordService();

      Logger.Debug("Starting Bot");
      StartBotAsync().GetAwaiter().GetResult();
    }

    /// <summary>
    /// Pre-Shutdown Event Handler
    /// </summary>
    /// <param name="sender"></param>
    /// <param name="e"></param>
    private static void _Shutdown(object? sender, EventArgs e)
    {
      Logger.Info("Disposing Services");

      try
      {
        _discordService.Stop();
        _discordService.Dispose();
      }
      catch { }

      try
      {
        _srlService.Dispose();
      }
      catch { }

      try
      {
        _contextSemaphore.Dispose();
      }
      catch { }
    }

    /// <summary>
    /// Initializes the discord service
    /// </summary>
    private static void InitDiscordService()
    {
      _discordService = new DiscordService();
      _discordService.OnDisconnected += OnDiscordDisconnected;
      _discordService.OnReady += OnDiscordReady;
      _discordService.OnChannelCreated += OnDiscordChannelCreated;
      _discordService.OnChannelDestroyed += OnDiscordChannelDeleted;
      _discordService.OnGuildJoined += OnDiscordGuildJoined;
      _discordService.OnGuildLeft += OnDiscordGuildLeft;
    }

    /// <summary>
    /// Initializes the SRL service
    /// </summary>
    private static void InitSrlService()
    {
      _srlService = new SRLService(30000);
      _srlService.OnUpdate += OnSrlUpdate;
    }

    /// <summary>
    /// Migrate the database the database
    /// </summary>
    private static void MigrateDatabase()
    {
      _contextSemaphore.WaitAsync();

      try
      {
        using DatabaseContext context = new ContextBuilder().CreateDbContext();
        DatabaseAdapter.Migrate(context);
      }
      catch (Exception ex)
      {
        Logger.Error("Failed to migrate context! Exiting");
        Logger.Error($"Exception thrown", ex);
        Environment.Exit(-1);
      }
      finally
      {
        _contextSemaphore.Release();
      }
    }

    #region events

    /// <summary>
    /// Enqueue new text channels
    /// </summary>
    private static void OnDiscordChannelCreated(object? sender, SocketTextChannel e)
          => _queueAddedChannels.Enqueue(e);

    /// <summary>
    /// Enqueue dropped text channels
    /// </summary>
    private static void OnDiscordChannelDeleted(object? sender, SocketTextChannel e)
          => _queueDeletedChannels.Enqueue(e);

    /// <summary>
    /// Try reconnecting after 10 seconds on discord disconnect
    /// </summary>
    private static void OnDiscordDisconnected(object? sender, Exception? e)
    {
      Logger.Info("Discord disconnected!");
      Logger.Info("Stopping Discord Service");
      _discordService.Stop();
      Logger.Info("Discord Service Stopped, Exiting");
      Environment.Exit(-2);
    }

    /// <summary>
    /// Mark channels for activation when joining a guild
    /// </summary>
    private static void OnDiscordGuildJoined(object? sender, SocketGuild e)
    {
      if (e?.TextChannels != null)
      {
        foreach (SocketTextChannel c in e.TextChannels)
          _queueAddedChannels.Enqueue(c);
      }
    }

    /// <summary>
    /// Mark channels for deactivation when leaving a guild
    /// </summary>
    private static void OnDiscordGuildLeft(object? sender, SocketGuild e)
          => _queueDeletedGuilds.Enqueue(e);

    /// <summary>
    /// Sync channels and guild when discord is ready
    /// </summary>
    private static void OnDiscordReady(object? sender, EventArgs? e)
    {
      Logger.Info("Discord Ready, waiting for lock");
      _contextSemaphore.Wait();
      Logger.Info("Lock acquired");

      try
      {
        Logger.Info("Loading guilds and channels");
        using (DatabaseContext context = new ContextBuilder().CreateDbContext())
        {
          context.Channels.Load();
          context.Guilds.Load();
          context.ChangeTracker.DetectChanges();
          ChannelAdapter.SyncAll(context, _discordService);
          context.SaveChanges();
        }
        Logger.Info("Guilds and channels loaded, enablint trigger");
        _srlService.IsUpdateTriggerEnabled = true;
      }
      catch (Exception ex)
      {
        Logger.Error($"Exception thrown", ex);
        Environment.Exit(-1);
      }
      finally
      {
        _contextSemaphore.Release();
      }
    }

    /// <summary>
    /// Update races and announcements
    /// </summary>
    private static void OnSrlUpdate(object? sender, IReadOnlyCollection<SRLApiClient.Endpoints.Races.Race> e)
    {
      _srlService.IsUpdateTriggerEnabled = false;

      Logger.Info("Waiting for lock..");
      _contextSemaphore.Wait();
      Logger.Info("Lock acquired");

      DateTime startTime = DateTime.UtcNow;
      bool updateSuccessful = false;

      try
      {
        using DatabaseContext context = new ContextBuilder().CreateDbContext();

        Logger.Info("Reloading context");
        context.LoadRemote();
        context.ChangeTracker.DetectChanges();

        Logger.Info("Processing channel mutations");
        ProcessChannelMutations(context);

        Logger.Info("Updating races");
        RaceAdapter.SyncRaces(context, _srlService, e.ToList());

        Logger.Info("Updating announcements");
        if (_isInitialLoad)
        {
          AnnouncementAdapter.UpdateAnnouncements(
           context
           , _discordService
           , context.Races.Local.ToList());

          _isInitialLoad = false;
        }
        else
        {
          AnnouncementAdapter.UpdateAnnouncements(
            context
            , _discordService
            , DatabaseAdapter.GetUpdatedRaces(context).ToList());
        }

        Logger.Info("Saving changes");
        context.SaveChanges();
        Logger.Info("Update completed");
        updateSuccessful = true;
      }
      catch (Exception ex)
      {
        Logger.Error($"Exception thrown", ex);
      }
      finally
      {
        try
        {
          Logger.Info("Creating update-table entry.");
          using DatabaseContext context = new ContextBuilder().CreateDbContext();
          context.Updates.Add(new Update(startTime, DateTime.UtcNow, updateSuccessful));
          context.SaveChanges();
          Logger.Info("Entry saved");
        }
        catch (Exception ex)
        {
          Logger.Error($"Exception thrown", ex);
        }

        _contextSemaphore.Release();
        _srlService.IsUpdateTriggerEnabled = true;
        Logger.Info("Released triggers");
      }
    }

    #endregion events

    #region Channel Mutations

    /// <summary>
    /// Add new channels and remove deleted channels
    /// </summary>
    /// <param name="context">The database context</param>
    private static void ProcessChannelMutations(DatabaseContext context)
    {
      RegisterNewChannels(context);
      UnregisterDeletedChannels(context);
      UnregisterDeletedGuilds(context);
    }

    /// <summary>
    /// Adds new channels to the context
    /// </summary>
    /// <param name="context">The database context</param>
    private static void RegisterNewChannels(DatabaseContext context)
    {
      while (_queueAddedChannels.TryDequeue(out SocketTextChannel? c))
      {
        if (c != null)
        {
          Logger.Info($"Registering channel '{c.Guild.Name}/{c.Name}'");
          ChannelAdapter.EnableChannel(context, c);
        }
      }
    }

    /// <summary>
    /// Disables trackers of deleted channels
    /// </summary>
    /// <param name="context">The database context</param>
    private static void UnregisterDeletedChannels(DatabaseContext context)
    {
      while (_queueDeletedChannels.TryDequeue(out SocketTextChannel? c))
      {
        if (c != null && context.GetChannel(c.Id) is Channel channel)
        {
          Logger.Info($"Disabling trackers for '{channel.Guild.DisplayName}/{channel.DisplayName}'");
          context.DisableTrackersByChannel(channel);
          channel.IsActive = false;
        }
      }
    }

    /// <summary>
    /// Disables trackers of deleted guilds
    /// </summary>
    /// <param name="context">The database context</param>
    private static void UnregisterDeletedGuilds(DatabaseContext context)
    {
      while (_queueDeletedGuilds.TryDequeue(out SocketGuild? g))
      {
        if (g != null && context.GetGuild(g.Id) is Guild guild)
        {
          Logger.Info($"Disabling trackers for '{guild.DisplayName}'");
          context.DisableTrackersByGuild(guild);

          Logger.Info($"Disabling channels for '{guild.DisplayName}'");
          context.DisableChannelsByGuild(guild);

          Logger.Info($"Disabling guild '{guild.DisplayName}'");
          guild.IsActive = false;
        }
      }
    }

    #endregion Channel Mutations

    /// <summary>
    /// Starts the bot routine
    /// </summary>
    private static async Task StartBotAsync()
    {
      await Task.Delay(5000).ConfigureAwait(false);

      string? token = Credentials.ParseDiscordToken();
      if (token == null)
        throw new Exception("Could not Load the discord token");

      _discordService.AuthenticateAsync(token).Wait();
      await _discordService.StartAsync().ConfigureAwait(false);
      _srlService.StartTimer();

      await Task.Delay(-1).ConfigureAwait(false);
    }
  }
}
