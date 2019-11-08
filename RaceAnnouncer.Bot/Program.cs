using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Discord.WebSocket;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using RaceAnnouncer.Bot.Adapters;
using RaceAnnouncer.Bot.Common;
using RaceAnnouncer.Bot.Data;
using RaceAnnouncer.Bot.Data.Controllers;
using RaceAnnouncer.Bot.Services;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.Bot
{
  internal static class Program
  {
    private static DiscordService _discordService = null!;
    private static SRLService _srlService = null!;

    private static readonly ConcurrentQueue<SocketGuild> _deletedGuilds = new ConcurrentQueue<SocketGuild>();
    private static readonly ConcurrentQueue<SocketTextChannel> _deletedChannels = new ConcurrentQueue<SocketTextChannel>();
    private static readonly ConcurrentQueue<SocketTextChannel> _addedChannels = new ConcurrentQueue<SocketTextChannel>();

    private static bool _isInitialLoad = true;

    private static readonly SemaphoreSlim _contextSemaphore = new SemaphoreSlim(1, 1);

#pragma warning disable IDE0060 // Remove unused parameter
#pragma warning disable RCS1163 // Unused parameter.
    /// <summary>
    /// Entry point
    /// </summary>
    internal static void Main(string[] args)
    {
      AppDomain.CurrentDomain.ProcessExit += ProcessShutdown;

      Logger.Debug("Initializing Database");
      InitDatabase();

      Logger.Debug("Initializing SRL Service");
      InitSrlService();

      Logger.Debug("Initializing Discord Service");
      InitDiscordService();

      Logger.Debug("Starting Bot");
      StartBotAsync().GetAwaiter().GetResult();
    }
#pragma warning restore RCS1163 // Unused parameter.
#pragma warning restore IDE0060 // Remove unused parameter

    /// <summary>
    /// Starts the bot routine
    /// </summary>
    private static async Task StartBotAsync()
    {
      string? token = Credentials.ParseDiscordToken();
      if (token == null)
        throw new Exception("Could not Load the discord token");

      _discordService.AuthenticateAsync(token).Wait();
      await _discordService.StartAsync().ConfigureAwait(false);
      _srlService.StartTimer();

      await Task.Delay(-1).ConfigureAwait(false);
    }

    /// <summary>
    /// Initializes the database
    /// </summary>
    private static void InitDatabase()
    {
      _contextSemaphore.WaitAsync();

      try
      {
        using DatabaseContext context = new DatabaseContextFactory().CreateDbContext();
        context.Database.Migrate();
      }
      catch (Exception ex)
      {
        Logger.Error("Failed to migrate context! Exiting");
        Logger.Error(ex.Message);
        Environment.Exit(-1);
      }
      finally
      {
        _contextSemaphore.Release();
      }
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
      _discordService.OnGuildLeft += OnDiscordGuildLeft;
    }

    /// <summary>
    /// Initializes the SRL service
    /// </summary>
    private static void InitSrlService()
    {
      _srlService = new SRLService();
      _srlService.OnUpdate += OnSrlUpdate;
    }

    private static void OnSrlUpdate(object? sender, IReadOnlyCollection<SRLApiClient.Endpoints.Races.Race> e)
    {
      _srlService.IsUpdateTriggerEnabled = false;
      _contextSemaphore.Wait();

      try
      {
        using DatabaseContext context = new DatabaseContextFactory().CreateDbContext();

        ProcessChannelMutations(context);

        Logger.Info("Reloading context");
        context.LoadRemote();
        context.ChangeTracker.DetectChanges();

        Logger.Info("Updating races");
        RaceAdapter.SyncRaces(context, _srlService, e);

        Logger.Info("Updating announcements");
        AnnouncementAdapter.UpdateAnnouncements(context, _discordService, GetUpdatedRaces(context));

        Logger.Info("Saving changes");
        context.SaveChanges();
        Logger.Info("Update completed");
      }
      catch (Exception ex)
      {
        Logger.Error($"Exception thrown: {ex.Message}");
      }
      finally
      {
        _contextSemaphore.Release();
        _srlService.IsUpdateTriggerEnabled = true;
      }
    }

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
      while (_addedChannels.TryDequeue(out SocketTextChannel? c))
      {
        if (c != null)
        {
          Logger.Info($"Registering channel '{c.Guild.Name}/{c.Name}'");
          Guild g = context.AddOrUpdate(new Guild(c.Guild.Id, c.Guild.Name));
          context.AddOrUpdate(new Channel(g, c.Id, c.Name));
        }
      }
    }

    /// <summary>
    /// Disables trackers of deleted channels
    /// </summary>
    /// <param name="context">The database context</param>
    private static void UnregisterDeletedChannels(DatabaseContext context)
    {
      while (_deletedChannels.TryDequeue(out SocketTextChannel? c))
      {
        if (c != null)
        {
          Logger.Info($"Disabling trackers for '{c.Guild.Name}/{c.Name}'");
          context.DisableTrackersByChannel(c.Id);
        }
      }
    }

    /// <summary>
    /// Disables trackers of deleted guilds
    /// </summary>
    /// <param name="context">The database context</param>
    private static void UnregisterDeletedGuilds(DatabaseContext context)
    {
      while (_deletedGuilds.TryDequeue(out SocketGuild? g))
      {
        if (g != null)
        {
          Logger.Info($"Disabling trackers for '{g.Name}'");
          context.DisableTrackersByGuild(g.Id);
        }
      }
    }

    /// <summary>
    /// Gets the the list of races in the specified <paramref name="context"/>
    /// which don't have an unchanged state
    /// </summary>
    /// <param name="context">The database context</param>
    /// <returns>Returns the list of changed races</returns>
    private static List<Race> GetUpdatedRaces(DatabaseContext context)
    {
      context.ChangeTracker.DetectChanges();

      List<Race> races = new List<Race>();

      if (_isInitialLoad)
      {
        foreach (Race race in context.Races.Local)
        {
          if ((DateTime.UtcNow - race.UpdatedAt) < TimeSpan.FromHours(12))
            races.Add(race);
        }

        _isInitialLoad = false;
        return races;
      }

      foreach (Race race in context.Races.Local)
      {
        if (HasEntityChanged(context.Entry(race))) races.Add(race);
        else if (context.GetEntrants(race).Any(e => HasEntityChanged(context.Entry(e)))) races.Add(race);
      }

      return races;
    }

    /// <summary>
    /// Checks whether an entity state is not <see cref="EntityState.Unchanged"/>
    /// </summary>
    /// <param name="entity">The entity</param>
    /// <returns>Returns true if the entities has changed</returns>
    private static bool HasEntityChanged(EntityEntry entity)
      => entity.State != EntityState.Unchanged;

    private static void OnDiscordDisconnected(object? sender, Exception? e)
    {
      _srlService.IsUpdateTriggerEnabled = false;

      _discordService.Stop();

      Thread.Sleep(10000);

      _discordService.StartAsync().Wait();
    }

    private static void OnDiscordGuildLeft(object? sender, SocketGuild e)
      => _deletedGuilds.Enqueue(e);

    private static void OnDiscordChannelDeleted(object? sender, SocketTextChannel e)
      => _deletedChannels.Enqueue(e);

    private static void OnDiscordChannelCreated(object? sender, SocketTextChannel e)
      => _addedChannels.Enqueue(e);

    private static void OnDiscordReady(object? sender, EventArgs? e)
    {
      _contextSemaphore.Wait();
      try
      {
        using (DatabaseContext context = new DatabaseContextFactory().CreateDbContext())
        {
          context.Channels.Load();
          context.Guilds.Load();
          context.ChangeTracker.DetectChanges();
          ChannelAdapter.SyncChannels(context, _discordService);
          context.ChangeTracker.DetectChanges();
          context.SaveChanges();
        }

        _srlService.IsUpdateTriggerEnabled = true;
      }
      catch (Exception ex)
      {
        Logger.Error("Failed to load channels! Exiting.");
        Logger.Error(ex.Message);
        Environment.Exit(-1);
      }
      finally
      {
        _contextSemaphore.Release();
      }
    }

    private static void ProcessShutdown(object? sender, EventArgs e)
    {
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
  }
}
