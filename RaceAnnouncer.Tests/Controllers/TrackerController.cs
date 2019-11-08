using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;
using RaceAnnouncer.Bot.Data.Controllers;
using RaceAnnouncer.Schema.Models;
using RaceAnnouncer.Schema.Models.Enumerations;

namespace RaceAnnouncer.Tests.Controllers
{
  [System.Diagnostics.CodeAnalysis.SuppressMessage("Nullable", "CS8600:Converting null literal or possible null value to non-nullable type.", Justification = "Assertion")]
  [System.Diagnostics.CodeAnalysis.SuppressMessage("Nullable", "CS8602:Dereference of a possibly null reference.", Justification = "Assertion")]
  [System.Diagnostics.CodeAnalysis.SuppressMessage("Nullable", "CS8604:Possible null reference argument for parameter.", Justification = "Assertion")]
  public class TrackerController : BaseControllerTest
  {
    [SetUp]
    public override void _Setup()
    {
      ResetContext();
    }

    [Test]
    public override void AddOrUpdate_Add_Duplicate_Keeps_Count()
    {
      int trackerCount = _context.Trackers.Local.Count;
      Tracker tracker = RandomLocalTracker;

      _context.AddOrUpdate(tracker);
      SaveChanges();

      Assert.AreEqual(trackerCount, _context.Trackers.Local.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Increases_Count()
    {
      int trackerCount = _context.Trackers.Local.Count;
      Channel channel = RandomLocalChannel;
      Game game = _context.AddOrUpdate(GenerateGame());

      Tracker tracker = new Tracker(channel, game);
      _context.AddOrUpdate(tracker);

      SaveChanges();

      Assert.AreEqual(trackerCount + 1, _context.Trackers.Local.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Stored_Correctly()
    {
      Channel channel = RandomLocalChannel;
      Game game = _context.AddOrUpdate(GenerateGame());

      Assert.IsNull(_context.GetTracker(game, channel));

      _context.AddOrUpdate(new Tracker(channel, game));
      SaveChanges();

      game = _context.GetGame(game.Abbreviation);
      channel = _context.GetChannel(channel.Snowflake);

      Assert.IsNotNull(_context.GetTracker(game, channel));
    }

    [Test]
    public override void AssignAttributes_Assigns_All_Attributes()
    {
      Tracker t1 = RandomLocalTracker;
      Tracker t2 = RandomLocalTracker;

      t1.AssignAttributes(t2);

      Assert.AreSame(t2.Channel, t1.Channel);
      Assert.AreSame(t2.Game, t1.Game);
    }

    [Test]
    public void GetActiveTrackers_All_Active()
    {
      Assert.True(_context.GetActiveTrackers().All(t => t.State == TrackerState.Active));
    }

    [Test]
    public void GetActiveTrackers_By_Game_All_Active()
    {
      Tracker tracker = RandomLocalTracker;
      Assert.True(
        _context
        .GetActiveTrackers(tracker.Game)
        .All(t => t.State == TrackerState.Active));
    }

    [Test]
    public void GetActiveTrackers_By_Game_Contains_Tracker()
    {
      Tracker tracker = RandomLocalActiveTracker;
      IEnumerable<Tracker> gameTrackers = _context.GetActiveTrackers(tracker.Game);
      Assert.Contains(tracker, gameTrackers.ToList());
    }

    [Test]
    public void GetActiveTrackers_Contains_Tracker()
    {
      Tracker tracker = RandomLocalActiveTracker;
      List<Tracker> trackers = _context.GetActiveTrackers().ToList();
      Assert.Contains(tracker, trackers);
    }

    [Test]
    public void GetTracker_Returns_NULL()
    {
      Assert.IsNull(_context.GetTracker(GenerateGame(), RandomLocalChannel));
    }

    [Test]
    public void GetTracker_Returns_Tracker()
    {
      Tracker tracker = RandomLocalTracker;
      Assert.AreSame(tracker, _context.GetTracker(tracker.Game, tracker.Channel));
    }
  }
}
