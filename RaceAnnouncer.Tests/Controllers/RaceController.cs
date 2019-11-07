using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using RaceAnnouncer.Tests.TestHelpers;
using RaceAnnouncer.Schema.Models;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Bot.Data.Controllers;

#pragma warning disable CS8604 // Possible null reference argument.
#pragma warning disable CS8602 // Dereference of a possibly null reference.

namespace RaceAnnouncer.Tests.Controllers
{
  public class RaceController
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
      Race race =
        new Race(
          _context.GetGame("g1")
          , "goal"
          , "srl1"
          , 123
          , true
          , SRLApiClient.Endpoints.RaceState.EntryOpen);

      Assert.AreEqual("g1"
        , race.Game.Abbreviation);

      Assert.AreEqual(0
        , _context.Races.Local.Count);

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(race);
      });

      Assert.AreEqual(1
        , _context.Races.Local.Count);

      Assert.AreEqual(EntityState.Added
        , _context.Entry(race).State);

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      ResetContext();

      Assert.AreEqual(1
        , _context.Races.Local.Count);

      Assert.AreNotSame(race
        , _context.Races.Local.First());

      Assert.AreEqual("g1"
        , _context.Races.Local.First().Game.Abbreviation);

      Assert.AreEqual(race.Goal
        , _context.Races.Local.First().Goal);

      Assert.AreEqual(race.SrlId
        , _context.Races.Local.First().SrlId);

      Assert.AreEqual(race.State
        , _context.Races.Local.First().State);

      Assert.AreEqual(race.Time
        , _context.Races.Local.First().Time);

      Assert.AreEqual(race.IsActive
        , _context.Races.Local.First().IsActive);
    }

    [Test]
    public void AddOrUpdate_Add_Two()
    {
      Race race1 =
        new Race(
          _context.GetGame("g1")
          , "goal"
          , "srl1"
          , 123
          , true
          , SRLApiClient.Endpoints.RaceState.EntryOpen);

      Race race2 =
        new Race(
          _context.GetGame("g1")
          , "goal"
          , "srl2"
          , 123
          , true
          , SRLApiClient.Endpoints.RaceState.EntryOpen);

      Assert.AreEqual(0
        , _context.Races.Local.Count);

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(race1);
      });

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(race2);
      });

      Assert.AreEqual(2
        , _context.Races.Local.Count);

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      ResetContext();

      Assert.AreEqual(2
        , _context.Races.Local.Count);
    }

    [Test]
    public void AddOrUpdate_Add_Duplicate()
    {
      Race race1 =
        new Race(
          _context.GetGame("g1")
          , "goal"
          , "srl1"
          , 123
          , true
          , SRLApiClient.Endpoints.RaceState.EntryOpen);

      Race race2 =
        new Race(
          _context.GetGame("g2")
          , "goal2"
          , "srl1"
          , 456
          , true
          , SRLApiClient.Endpoints.RaceState.EntryOpen);

      Assert.AreEqual(0
        , _context.Races.Local.Count);

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(race1);
      });

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(race2);
      });

      Assert.AreEqual(1
        , _context.Races.Local.Count);

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      ResetContext();

      Assert.AreEqual(1
        , _context.Races.Local.Count);
    }

    [Test]
    public void AddOrUpdate_Add_Duplicate_Archived()
    {
      Race race1 =
        new Race(
          _context.GetGame("g1")
          , "goal"
          , "srl1"
          , 123
          , true
          , SRLApiClient.Endpoints.RaceState.EntryOpen);

      Race race2 =
        new Race(
          _context.GetGame("g1")
          , "goal"
          , "srl1"
          , 123
          , true
          , SRLApiClient.Endpoints.RaceState.EntryOpen);

      Assert.AreEqual(0
        , _context.Races.Local.Count);

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(race1);
      });

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      ResetContext();

      Assert.AreEqual(1
        , _context.Races.Local.Count);

      Assert.DoesNotThrow(delegate
      {
        _context.Races.Local.First().IsActive = false;
      });

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      ResetContext();

      Assert.AreEqual(0
        , _context.Races.Local.Count);

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(race2);
      });

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      ResetContext();

      Assert.AreEqual(1
        , _context.Races.Local.Count);

      Assert.AreEqual(2
        , _context.Races.Count());
    }

    [Test]
    public void AssignAttributes()
    {
      Race race1 =
        new Race(
          _context.GetGame("g1")
          , "goal1"
          , "srl1"
          , 123
          , true
          , SRLApiClient.Endpoints.RaceState.EntryOpen);

      Race race2 =
        new Race(
          _context.GetGame("g2")
          , "goal2"
          , "srl2"
          , 456
          , false
          , SRLApiClient.Endpoints.RaceState.Over);

      Assert.DoesNotThrow(delegate
      {
        race1.AssignAttributes(race2);
      });

      Assert.AreEqual(race2.Game.Abbreviation
        , race1.Game.Abbreviation);

      Assert.AreEqual(race2.Goal
        , race1.Goal);

      Assert.AreEqual(race2.SrlId
        , race1.SrlId);

      Assert.AreEqual(race2.Time
        , race1.Time);

      Assert.AreEqual(race2.State
        , race1.State);

      Assert.AreEqual(race2.IsActive
        , race1.IsActive);
    }

    [Test]
    public void GetGame()
    {
      Race race =
        new Race(
          _context.GetGame("g1")
          , "goal1"
          , "srl1"
          , 123
          , true
          , SRLApiClient.Endpoints.RaceState.EntryOpen);

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(race);
      });

      Assert.AreEqual("g1"
        , _context.GetGame(race).Abbreviation);
    }

    [Test]
    public void GetRace()
    {
      Race race =
        new Race(
          _context.GetGame("g1")
          , "goal1"
          , "srl1"
          , 123
          , true
          , SRLApiClient.Endpoints.RaceState.EntryOpen);

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(race);
      });

      Assert.IsNotNull(_context.GetRace("srl1"));

      Assert.AreEqual(race.SrlId
        , _context.GetRace("srl1").SrlId);
    }
  }
}
