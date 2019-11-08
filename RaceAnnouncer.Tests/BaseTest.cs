using NUnit.Framework;
using System.Linq;
using RaceAnnouncer.Tests.TestHelpers;
using RaceAnnouncer.Schema.Models;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Schema.Models.Enumerations;
using System;

namespace RaceAnnouncer.Tests
{
  public abstract class BaseTest
  {
    private static readonly Random _rand = new Random();
    protected DatabaseContext _context = ContextHelper.GetContext();

    public void ResetContext()
    {
      Assert.DoesNotThrow(delegate
      {
        ContextHelper.ResetContext(ref _context);
      });

      Assert.DoesNotThrow(delegate
      {
        _context.LoadRemote();
      });
    }

    protected void SaveChanges(bool resetContext = true)
    {
      _context.SaveChanges();
      if (resetContext) ResetContext();
    }

    protected long Ticks => DateTime.UtcNow.Ticks >> 8;

    protected Game GenerateGame()
      => new Game($"{Ticks}", $"{Ticks}", Convert.ToInt32(Ticks & 0xFFFFFFF));

    protected Race GenerateRace(Game game)
      => new Race(game, $"{Ticks}", $"{Ticks}", Convert.ToInt32(Ticks & 0xFFFF), _rand.Next(0, 100) < 30, (SRLApiClient.Endpoints.RaceState)_rand.Next(1, 6));

    protected Entrant GenerateEntrant(Race race)
      => new Entrant(race, $"{Ticks}", (SRLApiClient.Endpoints.EntrantState)_rand.Next(1, 6), _rand.Next(-5, 10), _rand.Next(-5, 10));

    protected Guild GenerateGuild()
      => new Guild(Convert.ToUInt64(Ticks), $"{Ticks}");

    protected Channel GenerateChannel(Guild guild)
      => new Channel(guild, Convert.ToUInt64(Ticks), $"{Ticks}");

    protected Channel GenerateChannel()
      => new Channel(GenerateGuild(), Convert.ToUInt64(Ticks), $"{Ticks}");

    protected Game RandomLocalGame
      => _context.Games.Local.ToArray()[_rand.Next(0, _context.Games.Local.Count)];

    protected Race RandomLocalRace
      => _context.Races.Local.ToArray()[_rand.Next(0, _context.Races.Local.Count)];

    protected Guild RandomLocalGuild
      => _context.Guilds.Local.ToArray()[_rand.Next(0, _context.Guilds.Local.Count)];

    protected Channel RandomLocalChannel
      => _context.Channels.Local.ToArray()[_rand.Next(0, _context.Channels.Local.Count)];

    protected Tracker RandomLocalTracker
      => _context.Trackers.Local.ToArray()[_rand.Next(0, _context.Trackers.Local.Count)];

    protected Entrant RandomLocalEntrant
      => _context.Entrants.Local.ToArray()[_rand.Next(0, _context.Entrants.Local.Count)];

    protected Tracker RandomLocalActiveTracker => GetRandomActiveTracker();

    protected Tracker GetRandomActiveTracker()
    {
      Tracker[] trackers = _context.Trackers.Local.Where(t => t.State == TrackerState.Active).ToArray();
      return trackers[_rand.Next(0, trackers.Length)];
    }
  }
}
