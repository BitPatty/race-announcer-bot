using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Net.WebSockets;
using System.Threading;
using System.Threading.Tasks;
using Discord.WebSocket;
using Microsoft.EntityFrameworkCore;
using RaceAnnouncer.Bot.Adapters;
using RaceAnnouncer.Bot.Data.Controllers;
using RaceAnnouncer.Bot.Services;
using RaceAnnouncer.Bot.Util;
using RaceAnnouncer.Common;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.Bot
{
  internal static class Program
  {
    private static readonly SemaphoreSlim _contextSemaphore = new SemaphoreSlim(1, 1);

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
    internal static int Main()
    {
      TaskScheduler.UnobservedTaskException += TaskScheduler_UnobservedTaskException;
      AppDomain.CurrentDomain.ProcessExit += OnApplicationExit;

      try
      {
        Logger.Debug("Initializing Database");
        MigrateDatabase();
      }
      catch
      {
        return -1;
      }

      Logger.Debug("Initializing SRL Service");
      InitSrlService();

      Logger.Debug("Initializing Discord Service");
      InitDiscordService();

      Logger.Debug("Starting Bot");
      StartBotAsync().GetAwaiter().GetResult();

      return 0;
    }

    private static void TaskScheduler_UnobservedTaskException(object? sender, UnobservedTaskExceptionEventArgs e)
    {
      Logger.Error("Unobserved Exception", e?.Exception);

      if (e?.Exception?.InnerException is WebSocketException || e?.Exception?.InnerException?.InnerException is WebSocketException)
      {
        e.SetObserved();
        OnDiscordDisconnected(null, null);
      }
    }

    /// <summary>
    /// Pre-Shutdown Event Handler
    /// </summary>
    /// <param name="sender"></param>
    /// <param name="e"></param>
    private static void OnApplicationExit(object? sender, EventArgs e)
    {
      try
      {
        _contextSemaphore.Wait();
      }
      catch { }

      Logger.Info("Disposing Services");

      try
      {
        _discordService.StopAsync().Wait();
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
      _discordService.OnCommandReceived += OnDiscordCommandReceived;
    }

    /// <summary>
    /// Initializes the SRL service
    /// </summary>
    private static void InitSrlService()
    {
      double updateInterval = LoadUpdateInterval();

      Logger.Info($"Update Interval set to {updateInterval}ms");

      _srlService = new SRLService(updateInterval);
      _srlService.OnUpdate += OnSrlUpdate;
    }

    /// <summary>
    /// Parse the update interval from the environment variables
    /// </summary>
    /// <returns>Returns the update interval (Fallback 30 seconds)</returns>
    private static double LoadUpdateInterval()
    {
      try
      {
        string? updateInterval = Environment.GetEnvironmentVariable("UPDATE_INTERVAL");

        if (
          updateInterval != null
          && double.TryParse(updateInterval, out double res)
          && res >= 9999
        )
        {
          return res;
        }
      }
      catch (Exception ex)
      {
        Logger.Error("Failed to load update interval", ex);
      }

      return 30000;
    }

    /// <summary>
    /// Migrate the database the database
    /// </summary>
    private static void MigrateDatabase()
    {
      _contextSemaphore.Wait();

      try
      {
        using DatabaseContext context = new ContextBuilder().CreateDbContext();
        DatabaseAdapter.Migrate(context);
      }
      catch (Exception ex)
      {
        Logger.Error("Failed to migrate context! Exiting");
        Logger.Error("Exception thrown", ex);
        throw;
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
    /// Enqueue received commands
    /// </summary>
    private static async void OnDiscordCommandReceived(object? sender, SocketMessage e)
    {
      await _contextSemaphore
         .WaitAsync()
         .ConfigureAwait(false);

      try
      {
        if (e != null)
        {
          Logger.Info($"Running command: {e.Author.Username}{e.Author.Discriminator}: {e.Content}");
          await CommandRunner.RunAsync(e, _discordService).ConfigureAwait(false);
        }

        Logger.Info("Finished processing received commands");
      }
      catch (Exception ex)
      {
        Logger.Error("Exception thrown", ex);
      }
      finally
      {
        _contextSemaphore.Release();
      }
    }

    /// <summary>
    /// Try reconnecting after 10 seconds on discord disconnect
    /// </summary>
    private static void OnDiscordDisconnected(object? sender, Exception? e)
    {
      _contextSemaphore.Wait();

      try
      {
        Logger.Info("Discord disconnected!");
        Logger.Info("Stopping Discord Service");
        _discordService.StopAsync().Wait();
        Logger.Info("Discord Service Stopped, Exiting");
      }
      catch (Exception ex)
      {
        Logger.Error("Exception thrown", ex);
      }
      finally
      {
        _contextSemaphore.Release();
        Environment.Exit(-2);
      }
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
    private static async void OnDiscordReady(object? sender, EventArgs? e)
    {
      Logger.Info("Discord Ready, waiting for lock");
      await _contextSemaphore.WaitAsync().ConfigureAwait(false);
      Logger.Info("Lock acquired");

      try
      {
        Logger.Info("Loading guilds and channels");
        using (DatabaseContext context = new ContextBuilder().CreateDbContext())
        {
          await context
            .Channels
            .Include(c => c.Guild)
            .Include(c => c.Trackers)
            .LoadAsync()
            .ConfigureAwait(false);

          context.ChangeTracker.DetectChanges();
          ChannelAdapter.SyncAll(context, _discordService);
          context.SaveChanges();
        }

        _srlService.IsUpdateTriggerEnabled = true;
      }
      catch (Exception ex)
      {
        Logger.Error("Exception thrown", ex);
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
    private static async void OnSrlUpdate(object? sender, IReadOnlyCollection<SRLApiClient.Endpoints.Races.Race> e)
    {
      _srlService.IsUpdateTriggerEnabled = false;

      Logger.Info("Waiting for lock..");
      await _contextSemaphore.WaitAsync().ConfigureAwait(false);

      DateTime startTime = DateTime.UtcNow;
      bool updateSuccessful = false;

      try
      {
        using DatabaseContext context = new ContextBuilder().CreateDbContext();

        Logger.Info("Reloading context");
        await context.LoadRemoteAsync().ConfigureAwait(false);

        context.ChangeTracker.DetectChanges();

        Logger.Info("Processing channel mutations");
        ProcessChannelMutations(context);

        Logger.Info("Updating races");
        await RaceAdapter
            .SyncRaces(context, _srlService, e.ToList())
            .ConfigureAwait(false);

        Logger.Info("Updating announcements");
        await AnnouncementAdapter
            .UpdateAnnouncementsAsync(context, _discordService, DatabaseAdapter.GetUpdatedRaces(context).ToList())
            .ConfigureAwait(false);

        Logger.Info("Saving changes");
        await context.SaveChangesAsync().ConfigureAwait(false);

        Logger.Info("Update completed");
        updateSuccessful = true;
      }
      catch (Exception ex)
      {
        Logger.Error("Exception thrown", ex);
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
          Logger.Error("Exception thrown", ex);
          throw;
        }
        finally
        {
          _contextSemaphore.Release();
          _srlService.IsUpdateTriggerEnabled = true;
          Logger.Info("Released triggers");
        }
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
        throw new Exception("Failed to load the Discord token");

      await _discordService.AuthenticateAsync(token).ConfigureAwait(false);
      await _discordService.StartAsync().ConfigureAwait(false);
      _srlService.StartTimer();

      await Task.Delay(-1).ConfigureAwait(false);
    }
  }
}
