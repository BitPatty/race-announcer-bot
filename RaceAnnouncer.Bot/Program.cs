using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Discord;
using Discord.Rest;
using Discord.WebSocket;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using RaceAnnouncer.Bot.Common;
using RaceAnnouncer.Bot.Data;
using RaceAnnouncer.Bot.Data.Controllers;
using RaceAnnouncer.Bot.Data.Converters;
using RaceAnnouncer.Bot.Services;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.Bot
{
  internal static class Program
  {
    private static string? _envFilePath = null;

    private static DiscordService _discordService = null!;
    private static SRLService _srlService = null!;

    private static readonly ConcurrentQueue<ulong> _deletedGuilds = new ConcurrentQueue<ulong>();
    private static readonly ConcurrentQueue<ulong> _deletedChannels = new ConcurrentQueue<ulong>();
    private static readonly ConcurrentQueue<ulong> _addedChannels = new ConcurrentQueue<ulong>();

    private static bool _isInitialLoad = true;

    private static readonly SemaphoreSlim _contextSemaphore = new SemaphoreSlim(1, 1);

    internal static void Main(string[] args)
    {
      AppDomain.CurrentDomain.ProcessExit += ProcessShutdown;
      ParseCommandLineArgs(args);

      Logger.Debug("Initializing Database");
      InitDatabase();

      Logger.Debug("Initializing SRL Service");
      InitSrlService();

      Logger.Debug("Initializing Discord Service");
      InitDiscordService();

      Logger.Debug("Starting Bot");
      StartBot().GetAwaiter().GetResult();
    }

    private static async Task StartBot()
    {
      _discordService.Authenticate(Credentials.ParseDiscordToken()).Wait();
      await _discordService.Start().ConfigureAwait(false);
      _srlService.StartTimer();

      await Task.Delay(-1).ConfigureAwait(false);
    }

    private static void ParseCommandLineArgs(string[] args)
    {
      if (args.Length > 2)
      {
        for (int i = 0; i < args.Length - 1; i += 2)
        {
          switch (args[i])
          {
            case "config":
              _envFilePath = args[i + 1].StartsWith("/") ? args[i + 1]
                : Path.Combine(Directory.GetCurrentDirectory(), args[i + 1]);
              if (!File.Exists(_envFilePath)) throw new FileNotFoundException($"Config file not found: {_envFilePath}");
              break;
            default:
              throw new ArgumentException($"Unknown option: {args[i]}");
          }
        }
      }
    }

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

    private static void InitDiscordService()
    {
      _discordService = new DiscordService();
      _discordService.OnDisconnected += OnDiscordDisconnected;
      _discordService.OnReady += OnDiscordReady;
      _discordService.OnChannelCreated += OnDiscordChannelCreated;
      _discordService.OnChannelDestroyed += OnDiscordChannelDeleted;
      _discordService.OnGuildLeft += OnDiscordGuildLeft;
    }

    private static void InitSrlService()
    {
      _srlService = new SRLService();
      _srlService.OnUpdate += OnSrlUpdate;
    }

    private static void OnSrlUpdate(object? sender, IReadOnlyCollection<SRLApiClient.Endpoints.Races.Race> e)
    {
      _srlService.TriggersCauseUpdate = false;
      _contextSemaphore.Wait();

      try
      {
        using DatabaseContext context = new DatabaseContextFactory().CreateDbContext();

        Logger.Info("Reloading context");
        context.LoadRemote();
        context.ChangeTracker.DetectChanges();

        Logger.Info("Updating races");
        IEnumerable<Race> updatedRaces = UpdateActiveRaces(context, e);

        Logger.Info("Updating dropped races");
        UpdateDroppedRaces(context, updatedRaces);

        Logger.Info("Updating announcements");
        UpdateAnnouncements(context, GetUpdatedRaces(context));

        Logger.Info("Saving changes");

        context.SaveChanges();
        Logger.Info("Update completed");
      }
      catch { }
      finally
      {
        _contextSemaphore.Release();
        _srlService.TriggersCauseUpdate = true;
      }
    }

    private static void UpdateAnnouncements(DatabaseContext context, IEnumerable<Race> races)
    {
      foreach (Race race in races)
      {
        Logger.Info($"({race.SrlId}) Updating Announcements");

        foreach (Tracker tracker in context.GetActiveTrackers(race.Game))
        {
          Announcement? announcement = context.GetAnnouncement(race, tracker);

          if (announcement == null)
          {
            Logger.Info($"({race.SrlId}) Posting announcement in '{tracker.Channel.Guild.DisplayName}/{tracker.Channel.DisplayName}'.");

            RestUserMessage? message = _discordService.SendMessageAsync(tracker.Channel.Snowflake, GetEmbed(race)).Result;

            if (message != null)
            {
              announcement = new Announcement(tracker.Channel, tracker, race, message.Id)
              {
                MessageCreatedAt = DateTime.UtcNow
              };

              context.AddOrUpdate(announcement);
            }
          }
          else
          {
            Logger.Info($"({race.SrlId}) Updating announcement {announcement.Snowflake} in {tracker.Channel.Guild.DisplayName}/{tracker.Channel.DisplayName}.");

            Channel channel = context.GetChannel(announcement);
            RestUserMessage? message = _discordService.FindMessageAsync(channel, announcement.Snowflake).Result;

            if (message != null)
            {
              _discordService.ModifyMessageAsync(message, GetEmbed(race)).Wait();
              announcement.MessageUpdatedAt = DateTime.UtcNow;
            }
            else
            {
              Logger.Info($"({race.SrlId}) Failed to fetch message {announcement.Snowflake} in {tracker.Channel.Guild.DisplayName}/{tracker.Channel.DisplayName}.");
            }
          }

          Thread.Sleep(1000);
        }
      }
    }

    private static Embed GetEmbed(Race race)
      => EmbedFactory.Build(race);

    public static void UpdateDroppedRaces(DatabaseContext context, IEnumerable<Race> exclusions)
    {
      foreach (Race race in context.Races.Local.Where(r => r.IsActive && !exclusions.Contains(r)))
      {
        try
        {
          SRLApiClient.Endpoints.Races.Race srlRace = _srlService.GetRaceAsync(race.SrlId).Result;
          Schema.Models.Game game = context.AddOrUpdate(srlRace.Game.Convert());

          race.AssignAttributes(srlRace.Convert(game));
          race.IsActive = srlRace.State != SRLApiClient.Endpoints.RaceState.Over;

          foreach (SRLApiClient.Endpoints.Races.Entrant entrant in srlRace.Entrants)
            context.AddOrUpdate(entrant.Convert(race));
        }
        catch (Exception)
        {
          race.IsActive = false;
          race.State = SRLApiClient.Endpoints.RaceState.Unknown;
        }
      }
    }

    private static List<Race> UpdateActiveRaces(DatabaseContext context, IEnumerable<SRLApiClient.Endpoints.Races.Race> races)
    {
      List<Race> res = new List<Race>();

      foreach (SRLApiClient.Endpoints.Races.Race srlRace in races)
      {
        Logger.Info($"({srlRace.Id}) Updating game");
        Schema.Models.Game game = srlRace.Game.Convert();
        game = context.AddOrUpdate(game);

        Logger.Info($"({srlRace.Id}) Updating race");
        Race race = srlRace.Convert(game);
        race = context.AddOrUpdate(race);

        Logger.Info($"({srlRace.Id}) Updating entrants");
        foreach (SRLApiClient.Endpoints.Races.Entrant entrant in srlRace.Entrants)
          context.AddOrUpdate(entrant.Convert(race));

        IEnumerable<Entrant> registeredEntrants = context.GetEntrants(race);

        foreach (Entrant e in registeredEntrants.Where(e => !srlRace.Entrants.Any(s => s.Name.Equals(e.DisplayName))))
          context.DeleteEntrant(e);

        res.Add(race);
      }

      return res;
    }

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

    private static bool HasEntityChanged(EntityEntry entity)
      => entity.State != EntityState.Unchanged;

    private static void OnDiscordDisconnected(object? sender, Exception? e)
    {
      _srlService.TriggersCauseUpdate = false;

      _discordService.Stop();

      Thread.Sleep(10000);

      _discordService.Start().Wait();
    }

    private static void OnDiscordGuildLeft(object? sender, SocketGuild e)
      => _deletedGuilds.Enqueue(e.Id);

    private static void OnDiscordChannelDeleted(object? sender, SocketTextChannel e)
      => _deletedChannels.Enqueue(e.Id);

    private static void OnDiscordChannelCreated(object? sender, SocketTextChannel e)
      => _addedChannels.Enqueue(e.Id);

    private static void OnDiscordReady(object? sender, EventArgs? e)
    {
      _contextSemaphore.Wait();
      try
      {
        using (DatabaseContext context = new DatabaseContextFactory().CreateDbContext())
        {
          context.Channels.Load();
          context.Guilds.Load();

          LoadChannels(context, _discordService);
          context.SaveChanges();
        }

        _srlService.TriggersCauseUpdate = true;
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

    private static void LoadChannels(DatabaseContext context, DiscordService discordService)
    {
      List<SocketTextChannel> textChannels = discordService.GetTextChannels().ToList();
      textChannels.ForEach(c =>
      {
        Guild g = context.AddOrUpdate(c.Guild.Convert());
        context.AddOrUpdate(c.Convert(g));
      });

      context.Channels.Local.ToList().ForEach(c =>
      {
        if (!textChannels.Any(tc => tc.Id.Equals(c.Snowflake)))
          context.DisableTrackersByChannel(c.Snowflake);
      });
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
        _contextSemaphore.Dispose();
      }
      catch { }
    }
  }
}
