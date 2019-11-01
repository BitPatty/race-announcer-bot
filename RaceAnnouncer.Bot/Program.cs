using System;
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

    private static DatabaseContext _context = null!;

    private static DiscordService _discordService = null!;
    private static SRLService _srlService = null!;

    private static bool _isInitialLoad = true;

    internal static void Main(string[] args)
    {
      AppDomain.CurrentDomain.ProcessExit += ProcessShutdown;
      ParseCommandLineArgs(args);

      Console.WriteLine("Initializing Database");
      InitDatabase();

      Console.WriteLine("Initializing Srl");
      InitSrlService();

      Console.WriteLine("Initializing Discord");
      InitDiscordService();

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
      _context = new DatabaseContextFactory().CreateDbContext();
      _context.Database.Migrate();
      _context.LoadRemote();
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

      try
      {
        Console.WriteLine($"{DateTime.Now.ToLongTimeString()}: Updating races..");
        IEnumerable<Race> updatedRaces = UpdateActiveRaces(e);

        Console.WriteLine($"{DateTime.Now.ToLongTimeString()}: Updating dropped races..");
        UpdateDroppedRaces(updatedRaces);

        Console.WriteLine($"{DateTime.Now.ToLongTimeString()}: Updating announcements..");
        UpdateAnnouncements(GetUpdatedRaces());

        Console.WriteLine($"{DateTime.Now.ToLongTimeString()}: Races updated");

        _context.SaveChanges();
        _context.LoadRemote();
        Console.WriteLine($"{DateTime.Now.ToLongTimeString()}: Changes saved");
      }
      catch { }
      finally
      {
        _srlService.TriggersCauseUpdate = true;
      }
    }

    private static void UpdateAnnouncements(IEnumerable<Race> races)
    {
      Console.WriteLine("Updating Announcements");
      foreach (Race race in races)
      {
        Console.WriteLine($"Updating Announcements for ${race.SrlId}");

        foreach (Tracker tracker in _context.GetActiveTrackers(race.Game))
        {
          Announcement? announcement = _context.GetAnnouncement(race, tracker);

          if (announcement == null)
          {
            Console.WriteLine($"({race.SrlId}) Creating message in {tracker.Channel.Guild.DisplayName}/{tracker.Channel.DisplayName}.");

            RestUserMessage? message = _discordService.SendMessageAsync(tracker.Channel.Snowflake, GetEmbed(race)).Result;

            if (message != null)
            {
              announcement = new Announcement(tracker.Channel, tracker, race, message.Id)
              {
                MessageCreatedAt = DateTime.UtcNow
              };

              _context.AddOrUpdate(announcement);
            }
          }
          else
          {
            Console.WriteLine($"({race.SrlId}) Editing message {announcement.Snowflake} in {tracker.Channel.Guild.DisplayName}/{tracker.Channel.DisplayName}.");

            Channel channel = _context.GetChannel(announcement);
            RestUserMessage? message = _discordService.FindMessageAsync(channel, announcement.Snowflake).Result;

            if (message != null)
            {
              _discordService.ModifyMessageAsync(message, GetEmbed(race)).Wait();
              announcement.MessageUpdatedAt = DateTime.UtcNow;
            }
            else
            {
              Console.WriteLine($"({race.SrlId}) Failed to fetch message {announcement.Snowflake} in {tracker.Channel.Guild.DisplayName}/{tracker.Channel.DisplayName}.");
            }
          }

          Thread.Sleep(1000);
        }
      }
    }

    private static Embed GetEmbed(Race race)
      => EmbedFactory.Build(race);

    public static void UpdateDroppedRaces(IEnumerable<Race> exclusions)
    {
      foreach (Race race in _context.Races.Local.Where(r => r.IsActive && !exclusions.Contains(r)))
      {
        try
        {
          SRLApiClient.Endpoints.Races.Race srlRace = _srlService.GetRaceAsync(race.SrlId).Result;
          Schema.Models.Game game = _context.AddOrUpdate(srlRace.Game.Convert());

          race.AssignAttributes(srlRace.Convert(game));
          race.IsActive = srlRace.State != SRLApiClient.Endpoints.RaceState.Over;

          foreach (SRLApiClient.Endpoints.Races.Entrant entrant in srlRace.Entrants)
            _context.AddOrUpdate(entrant.Convert(race));
        }
        catch (Exception)
        {
          race.IsActive = false;
          race.State = SRLApiClient.Endpoints.RaceState.Unknown;
        }
      }
    }

    private static List<Race> UpdateActiveRaces(IEnumerable<SRLApiClient.Endpoints.Races.Race> races)
    {
      List<Race> res = new List<Race>();
      _context.ChangeTracker.DetectChanges();

      foreach (SRLApiClient.Endpoints.Races.Race srlRace in races)
      {
        Console.WriteLine($"{DateTime.Now.ToLongTimeString()}: ({srlRace.Id}) Updating game..");
        Schema.Models.Game game = srlRace.Game.Convert();
        game = _context.AddOrUpdate(game);

        Console.WriteLine($"{DateTime.Now.ToLongTimeString()}: ({srlRace.Id}) Updating race..");
        Race race = srlRace.Convert(game);
        race = _context.AddOrUpdate(race);

        Console.WriteLine($"{DateTime.Now.ToLongTimeString()}: ({srlRace.Id}) Updating entrants..");
        foreach (SRLApiClient.Endpoints.Races.Entrant entrant in srlRace.Entrants)
          _context.AddOrUpdate(entrant.Convert(race));

        res.Add(race);
      }

      return res;
    }

    private static List<Race> GetUpdatedRaces()
    {
      _context.ChangeTracker.DetectChanges();

      List<Race> races = new List<Race>();

      if (_isInitialLoad)
      {
        foreach (Race race in _context.Races.Local)
        {
          if ((DateTime.UtcNow - race.UpdatedAt) < TimeSpan.FromHours(12))
            races.Add(race);
        }

        _isInitialLoad = false;
        return races;
      }

      foreach (Race race in _context.Races.Local)
      {
        if (HasEntityChanged(_context.Entry(race))) races.Add(race);
        else if (_context.GetEntrants(race).Any(e => HasEntityChanged(_context.Entry(e)))) races.Add(race);
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
      => _context.DisableTrackersByGuild(e.Id);

    private static void OnDiscordChannelDeleted(object? sender, SocketTextChannel e)
      => _context.DisableTrackersByChannel(e.Id);

    private static void OnDiscordChannelCreated(object? sender, SocketTextChannel e)
    {
      Guild g = _context.AddOrUpdate(e.Guild.Convert());
      _context.AddOrUpdate(e.Convert(g));
    }

    private static void OnDiscordReady(object? sender, EventArgs? e)
    {
      if (sender is DiscordService discordService) LoadChannels(discordService);

#if DEBUG
      if (_context.Games.Local.Count < 1000)
      {
        _srlService.GetGameList().ToList().ForEach(g => { try { _context.AddOrUpdate(g.Convert()); } catch { } });
        _context.SaveChanges();
      }
      if (_context.Trackers.Local.Count < 1000)
      {
        Channel channel = _context.Channels.Local.First(c => c.Snowflake.Equals(526600389756190720));

        foreach (Schema.Models.Game game in _context.Games.Local)
        {
          Tracker t = new Tracker(channel, game);
          _context.Trackers.Add(t);
        }
        _context.SaveChanges();
      }
#endif
      _srlService.TriggersCauseUpdate = true;
    }

    private static void LoadChannels(DiscordService discordService)
    {
      List<SocketTextChannel> textChannels = discordService.GetTextChannels().ToList();
      textChannels.ForEach(c =>
      {
        Guild g = _context.AddOrUpdate(c.Guild.Convert());
        _context.AddOrUpdate(c.Convert(g));
      });

      _context.Channels.Local.ToList().ForEach(c =>
      {
        if (!textChannels.Any(tc => tc.Id.Equals(c.Snowflake)))
          _context.DisableTrackersByChannel(c.Snowflake);
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
        _context.Dispose();
      }
      catch { }
    }
  }
}
