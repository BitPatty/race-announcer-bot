using System;
using System.Linq;
using NUnit.Framework;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Schema.Models;
using RaceAnnouncer.Schema.Models.Enumerations;
using RaceAnnouncer.Tests.TestHelpers;

namespace RaceAnnouncer.Tests
{
  public abstract class BaseTest
  {
    protected DatabaseContext _context = ContextHelper.GetContext();
    private static readonly Random _rand = new Random();
    protected long Ticks => DateTime.UtcNow.Ticks >> 8;

    protected Tracker RandomLocalActiveTracker => GetRandomActiveTracker();

    protected Announcement RandomLocalAnnouncement
      => _context.Announcements.Local.ToArray()[_rand.Next(0, _context.Announcements.Local.Count)];

    protected Channel RandomLocalChannel
      => _context.Channels.Local.ToArray()[_rand.Next(0, _context.Channels.Local.Count)];

    protected Entrant RandomLocalEntrant
      => _context.Entrants.Local.ToArray()[_rand.Next(0, _context.Entrants.Local.Count)];

    protected Game RandomLocalGame
      => _context.Games.Local.ToArray()[_rand.Next(0, _context.Games.Local.Count)];

    protected Guild RandomLocalGuild
      => _context.Guilds.Local.ToArray()[_rand.Next(0, _context.Guilds.Local.Count)];

    protected Race RandomLocalRace
      => _context.Races.Local.ToArray()[_rand.Next(0, _context.Races.Local.Count)];

    protected Tracker RandomLocalTracker
      => _context.Trackers.Local.ToArray()[_rand.Next(0, _context.Trackers.Local.Count)];

    public void ResetContext()
    {
      Assert.DoesNotThrow(delegate
      {
        ContextHelper.ResetContext(ref _context);
      });

      Assert.DoesNotThrow(delegate
      {
        _context.LoadRemoteAsync().Wait();
      });
    }

    protected Announcement GenerateAnnouncement(Tracker tracker, Race race)
      => new Announcement(tracker.Channel, tracker, race, Convert.ToUInt64(Ticks));

    protected Channel GenerateChannel(Guild guild)
      => new Channel(guild, Convert.ToUInt64(Ticks), $"{Ticks}");

    protected Channel GenerateChannel()
      => new Channel(RandomLocalGuild, Convert.ToUInt64(Ticks), $"{Ticks}");

    protected Entrant GenerateEntrant(Race race)
      => new Entrant(race, $"{Ticks}", (SRLApiClient.Endpoints.EntrantState)_rand.Next(1, 6), _rand.Next(-5, 10), _rand.Next(-5, 10));

    protected Game GenerateGame()
      => new Game($"{Ticks}", $"{Ticks}", Convert.ToInt32(Ticks & 0xFFFFFFF));

    protected Guild GenerateGuild()
      => new Guild(Convert.ToUInt64(Ticks), $"{Ticks}");

    protected Race GenerateRace(Game game)
      => new Race(game, $"{Ticks}", $"{Convert.ToInt32(Ticks & 0xFFFF)}", Convert.ToInt32(Ticks & 0xFFFF), true, (SRLApiClient.Endpoints.RaceState)_rand.Next(1, 5));

    protected Tracker GetRandomActiveTracker()
    {
      Tracker[] trackers = _context.Trackers.Local.Where(t => t.State == TrackerState.Active).ToArray();
      return trackers[_rand.Next(0, trackers.Length)];
    }

    protected void SaveChanges(bool resetContext = true)
    {
      _context.SaveChanges();
      if (resetContext) ResetContext();
    }
  }
}
