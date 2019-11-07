using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using RaceAnnouncer.Tests.TestHelpers;
using RaceAnnouncer.Schema.Models;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Bot.Data.Controllers;
using RaceAnnouncer.Schema.Models.Enumerations;

#pragma warning disable CS8602 // Dereference of a possibly null reference.
#pragma warning disable CS8604 // Possible null reference argument.

namespace RaceAnnouncer.Tests.Controllers
{
  public class TrackerController
  {
    private DatabaseContext _context = ContextHelper.GetContext();

    [SetUp]
    public void Setup()
    {
      ResetContext();
      ResetDatabase();
      ResetContext();

      _context.AddOrUpdate(new Guild(1, "Guild 1"));
      _context.AddOrUpdate(new Guild(2, "Guild 2"));
      _context.AddOrUpdate(new Guild(3, "Guild 3"));
      _context.AddOrUpdate(new Guild(4, "Guild 4"));

      _context.Channels.Add(new Channel(_context.GetGuild(1), 1, "Channel 1"));
      _context.Channels.Add(new Channel(_context.GetGuild(1), 2, "Channel 2"));
      _context.Channels.Add(new Channel(_context.GetGuild(2), 3, "Channel 3"));
      _context.Channels.Add(new Channel(_context.GetGuild(3), 4, "Channel 4"));

      _context.Games.Add(new Game("g1", "Game 1", 1));
      _context.Games.Add(new Game("g2", "Game 2", 2));
      _context.Games.Add(new Game("g3", "Game 3", 3));
      _context.Games.Add(new Game("g4", "Game 4", 4));
      _context.SaveChanges();

      ResetContext();
    }

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

    public void ResetDatabase()
    {
      Assert.DoesNotThrow(delegate
      {
        ContextHelper.ResetDatabase(_context);
      });

      Assert.AreEqual(0
        , _context.Guilds.Count());
    }

    [Test]
    public void AddOrUpdate_Add_One()
    {
      Tracker tracker =
        new Tracker(
          _context.GetChannel(1)
          , _context.GetGame("g1"));

      Assert.IsNotNull(tracker.Channel);
      Assert.IsNotNull(tracker.Game);

      Assert.AreEqual(TrackerState.Created
        , tracker.State);

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(tracker);
      });

      Assert.AreEqual(1
        , _context.Trackers.Local.Count);

      Assert.AreSame(tracker
        , _context.Trackers.Local.First());

      Assert.AreEqual(EntityState.Added
        , _context.Entry(tracker).State);

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      ResetContext();

      Assert.AreEqual(1
        , _context.Trackers.Local.Count);

      Assert.AreNotSame(tracker
        , _context.Trackers.Local.First());

      Assert.AreEqual(_context.GetChannel(1)?.Snowflake
        , tracker.Channel.Snowflake);

      Assert.AreEqual(_context.GetGame("g1")?.Abbreviation
        , tracker.Game.Abbreviation);

      Assert.AreEqual(TrackerState.Created
        , tracker.State);
    }

    [Test]
    public void AddOrUpdate_Add_Two()
    {
      Tracker tracker1 =
        new Tracker(
          _context.GetChannel(1)
          , _context.GetGame("g1"));

      Tracker tracker2 =
        new Tracker(
          _context.GetChannel(2)
          , _context.GetGame("g1"));

      _context.AddOrUpdate(tracker1);
      _context.AddOrUpdate(tracker2);

      Assert.AreEqual(2
        , _context.Trackers.Local.Count);

      Assert.AreEqual(EntityState.Added
        , _context.Entry(tracker1).State);

      Assert.AreEqual(EntityState.Added
        , _context.Entry(tracker2).State);

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });
    }

    [Test]
    public void AddOrUpdate_Add_Duplicate()
    {
      Tracker tracker1 =
        new Tracker(
          _context.GetChannel(1)
          , _context.GetGame("g1"));

      Tracker tracker2 =
        new Tracker(
          _context.GetChannel(1)
          , _context.GetGame("g1"));

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(tracker1);
      });
      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(tracker2);
      });

      Assert.AreEqual(1
        , _context.Trackers.Local.Count);

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });
    }

    [Test]
    public void AssignAttributes()
    {
      Tracker tracker1 =
        new Tracker(
          _context.GetChannel(1)
          , _context.GetGame("g1"));

      Tracker tracker2 =
        new Tracker(
          _context.GetChannel(1)
          , _context.GetGame("g2"));

      Assert.DoesNotThrow(delegate
      {
        tracker1.AssignAttributes(tracker2);
      });

      Assert.AreEqual(tracker2.Game.Abbreviation
        , tracker1.Game.Abbreviation);

      Assert.AreEqual(tracker2.Channel.Snowflake
        , tracker1.Channel.Snowflake);
    }

    [Test]
    public void GetTracker()
    {
      Assert.IsNull(_context.GetTracker(
        _context.GetGame("g1")
        , _context.GetChannel(1)));

      Tracker tracker =
        new Tracker(
          _context.GetChannel(1)
          , _context.GetGame("g1"));

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(tracker);
      });

      Assert.IsNotNull(_context.GetTracker(
        _context.GetGame("g1")
        , _context.GetChannel(1)));
    }

    [Test]
    public void GetActiveTrackers_By_Game()
    {
      Assert.AreEqual(0
        , _context.GetActiveTrackers(_context
          .GetGame("g1"))
          .Count());

      Tracker tracker =
        new Tracker(
          _context.GetChannel(1)
          , _context.GetGame("g1"))
        {
          State = TrackerState.Active
        };

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(tracker);
      });

      Assert.AreEqual(1
        , _context.GetActiveTrackers(_context
          .GetGame("g1"))
          .Count());

      Assert.AreEqual(1
        , _context.GetActiveTrackers(
          _context.GetGame("g1"))
          .First()
          .Channel
          .Snowflake);

      tracker.State = TrackerState.Dead;

      Assert.DoesNotThrow(delegate { _context.AddOrUpdate(tracker); });
      Assert.AreEqual(0
        , _context.GetActiveTrackers(
          _context
          .GetGame("g1"))
        .Count());
    }

    [Test]
    public void GetActiveTracker()
    {
      Assert.AreEqual(0
        , _context
          .GetActiveTrackers()
          .Count());

      Tracker tracker =
        new Tracker(
          _context.GetChannel(1)
          , _context.GetGame("g1"))
        {
          State = TrackerState.Active
        };

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(tracker);
      });

      Assert.AreEqual(1
        , _context.GetActiveTrackers().Count());

      Assert.AreEqual(1
        , _context
          .GetActiveTrackers()
          .First()
          .Channel
          .Snowflake);

      Assert.AreEqual("g1"
        , _context
          .GetActiveTrackers()
          .First()
          .Game
          .Abbreviation);

      tracker.State = TrackerState.Dead;

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(tracker);
      });

      Assert.AreEqual(0
        , _context.GetActiveTrackers().Count());
    }

    [Test]
    public void DisableTrackersByChannel_Channel()
    {
      Assert.AreEqual(0
        , _context.GetActiveTrackers().Count());

      Tracker tracker =
        new Tracker(
          _context.GetChannel(1)
          , _context.GetGame("g1"))
        {
          State = TrackerState.Active
        };

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(tracker);
      });

      Assert.AreEqual(1
        , _context
          .GetActiveTrackers()
          .Count());

      Assert.AreEqual(1
        , _context
          .GetActiveTrackers()
          .First()
          .Channel
          .Snowflake);

      Assert.AreEqual("g1"
        , _context
          .GetActiveTrackers()
          .First()
          .Game
          .Abbreviation);

      Assert.DoesNotThrow(delegate
      {
        _context.DisableTrackersByChannel(
          _context.GetChannel(1));
      }
      );

      Assert.AreEqual(0
        , _context
          .GetActiveTrackers()
          .Count());
    }

    [Test]
    public void DisableTrackersByChannel_Snowflake()
    {
      Assert.AreEqual(0
        , _context
          .GetActiveTrackers()
          .Count());

      Tracker tracker =
        new Tracker(
          _context.GetChannel(1)
          , _context.GetGame("g1"))
        {
          State = TrackerState.Active
        };

      _context.AddOrUpdate(tracker);

      Assert.AreEqual(1
        , _context
          .GetActiveTrackers()
          .Count());

      Assert.AreEqual(1
        , _context
          .GetActiveTrackers()
          .First()
          .Channel
          .Snowflake);

      Assert.AreEqual("g1"
        , _context
          .GetActiveTrackers()
          .First()
          .Game
          .Abbreviation);

      Assert.DoesNotThrow(delegate
      {
        _context.DisableTrackersByChannel(
          _context
            .GetChannel(1)
            .Snowflake);
      });

      Assert.AreEqual(0
        , _context
          .GetActiveTrackers()
          .Count());
    }

    [Test]
    public void DisableTrackersByGuild_Snowflake()
    {
      Assert.AreEqual(0
        , _context
          .GetActiveTrackers()
          .Count());

      Tracker tracker =
        new Tracker(
          _context.GetChannel(1)
          , _context.GetGame("g1"))
        {
          State = TrackerState.Active
        };

      _context.AddOrUpdate(tracker);

      Assert.AreEqual(1
        , _context
          .GetActiveTrackers()
          .Count());

      Assert.AreEqual(1
        , _context
          .GetActiveTrackers()
          .First()
          .Channel
          .Snowflake);

      Assert.AreEqual("g1"
        , _context
          .GetActiveTrackers()
          .First()
          .Game
          .Abbreviation);

      Assert.DoesNotThrow(delegate
      {
        _context.DisableTrackersByGuild(
          _context
            .GetChannel(1)
            .Guild
            .Snowflake);
      });

      Assert.AreEqual(0
        , _context
          .GetActiveTrackers()
          .Count());
    }
  }
}
