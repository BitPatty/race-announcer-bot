using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using RaceAnnouncer.Tests.TestHelpers;
using RaceAnnouncer.Schema.Models;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Bot.Data.Controllers;

#pragma warning disable CS8602 // Dereference of a possibly null reference.
#pragma warning disable CS8604 // Possible null reference argument.

namespace RaceAnnouncer.Tests.Controllers
{
  public class EntrantController
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

      _context.Races.Add(new Race(_context.GetGame("g1"), "Goal 1", "r1", 1, true, SRLApiClient.Endpoints.RaceState.EntryOpen));
      _context.Races.Add(new Race(_context.GetGame("g1"), "Goal 2", "r2", 2, true, SRLApiClient.Endpoints.RaceState.EntryClosed));
      _context.Races.Add(new Race(_context.GetGame("g2"), "Goal 3", "r3", 3, true, SRLApiClient.Endpoints.RaceState.Over));
      _context.Races.Add(new Race(_context.GetGame("g3"), "Goal 4", "r4", 4, true, SRLApiClient.Endpoints.RaceState.Finished));

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
      Assert.AreEqual(0
        , _context.GetRace("r1").Entrants.Count);

      Assert.AreEqual(0
        , _context.Entrants.Local.Count);

      Entrant entrant =
        new Entrant(
          _context.GetRace("r1")
          , "Foo"
          , SRLApiClient.Endpoints.EntrantState.Entered
          , null
          , null);

      Assert.IsNotNull(entrant.Race);

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(entrant);
      });

      Assert.AreEqual(EntityState.Added
        , _context.Entry(entrant).State);

      Assert.AreEqual(1
        , _context.GetRace("r1").Entrants.Count);

      Assert.IsNotNull(_context.GetEntrant(_context.GetRace("r1")
        , entrant.DisplayName));

      Assert.AreEqual(1
        , _context.Entrants.Local.Count);

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      ResetContext();

      Assert.AreEqual(1
        , _context.GetRace("r1").Entrants.Count);

      Assert.AreEqual(1
        , _context.Entrants.Local.Count);

      Assert.AreEqual(entrant.DisplayName
        , _context.Entrants.Local.First().DisplayName);
    }

    [Test]
    public void AddOrUpdate_Add_Two()
    {
      Assert.AreEqual(0
        , _context.GetRace("r1").Entrants.Count);

      Assert.AreEqual(0
        , _context.Entrants.Local.Count);

      Entrant entrant1 =
        new Entrant(
          _context.GetRace("r1")
          , "Foo"
          , SRLApiClient.Endpoints.EntrantState.Entered
          , null
          , null);

      Entrant entrant2 =
        new Entrant(
          _context.GetRace("r1")
          , "Bar"
          , SRLApiClient.Endpoints.EntrantState.Entered
          , null
          , null);

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(entrant1);
      });

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(entrant2);
      });

      Assert.AreEqual(EntityState.Added
        , _context.Entry(entrant1).State);

      Assert.AreEqual(EntityState.Added
        , _context.Entry(entrant2).State);

      Assert.AreEqual(2
        , _context.GetRace("r1").Entrants.Count);

      Assert.AreEqual(2
        , _context.Entrants.Local.Count);

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      ResetContext();

      Assert.AreEqual(2
        , _context.GetRace("r1").Entrants.Count);

      Assert.AreEqual(2
        , _context.Entrants.Local.Count);
    }

    [Test]
    public void AddOrUpdate_Add_Duplicate()
    {
      Assert.AreEqual(0
        , _context.GetRace("r1").Entrants.Count);

      Assert.AreEqual(0
        , _context.Entrants.Local.Count);

      Entrant entrant1 =
        new Entrant(
          _context.GetRace("r1")
          , "Foo"
          , SRLApiClient.Endpoints.EntrantState.Entered
          , null
          , null);

      Entrant entrant2 =
        new Entrant(
          _context.GetRace("r1")
          , "Foo"
          , SRLApiClient.Endpoints.EntrantState.Entered
          , null
          , null);

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(entrant1);
      });

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(entrant2);
      });

      Assert.AreEqual(1
        , _context.GetRace("r1").Entrants.Count);

      Assert.AreEqual(1
        , _context.Entrants.Local.Count);

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      ResetContext();

      Assert.AreEqual(1
        , _context.GetRace("r1").Entrants.Count);

      Assert.AreEqual(1
        , _context.Entrants.Local.Count);
    }

    [Test]
    public void AddOrUpdate_CI_Add_Duplicate()
    {
      Assert.AreEqual(0
        , _context.GetRace("r1").Entrants.Count);

      Assert.AreEqual(0
        , _context.Entrants.Local.Count);

      Entrant entrant1 =
        new Entrant(
          _context.GetRace("r1")
          , "Foo"
          , SRLApiClient.Endpoints.EntrantState.Entered
          , null
          , null);

      Entrant entrant2 =
        new Entrant(
          _context.GetRace("r1")
          , "foo"
          , SRLApiClient.Endpoints.EntrantState.Entered
          , null
          , null);

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(entrant1);
      });

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(entrant2);
      });

      Assert.AreEqual(1
        , _context.GetRace("r1").Entrants.Count);

      Assert.AreEqual(1
        , _context.Entrants.Local.Count);

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      ResetContext();

      Assert.AreEqual(1
        , _context.GetRace("r1").Entrants.Count);

      Assert.AreEqual(1
        , _context.Entrants.Local.Count);
    }

    [Test]
    public void DeleteEntrant()
    {
      Assert.AreEqual(0
        , _context.GetRace("r1").Entrants.Count);

      Entrant entrant =
        new Entrant(
          _context.GetRace("r1")
          , "Foo"
          , SRLApiClient.Endpoints.EntrantState.Entered
          , null
          , null);

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(entrant);
      });

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      ResetContext();

      Assert.AreEqual(1
        , _context.GetRace("r1").Entrants.Count);

      Assert.IsNotNull(_context.GetEntrant(
        _context.GetRace("r1")
        , entrant.DisplayName));

      Assert.DoesNotThrow(delegate
      {
        _context.DeleteEntrant(_context.GetRace("r1").Entrants.First());
      });

      Assert.AreEqual(EntityState.Deleted
        , _context.Entry(_context.GetRace("r1").Entrants.First()).State);

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      Assert.AreEqual(0
        , _context.GetRace("r1").Entrants.Count);

      Assert.IsNull(_context.GetEntrant(
        _context.GetRace("r1")
        , entrant.DisplayName));
    }

    [Test]
    public void DeleteEntrant_Non_Existing()
    {
      Entrant entrant =
        new Entrant(
          _context.GetRace("r1")
          , "Foo"
          , SRLApiClient.Endpoints.EntrantState.Entered
          , null
          , null);

      Assert.DoesNotThrow(delegate { _context.DeleteEntrant(entrant); });
    }

    [Test]
    public void GetEntrant()
    {
      Entrant entrant =
        new Entrant(
          _context.GetRace("r1")
          , "Foo"
          , SRLApiClient.Endpoints.EntrantState.Entered
          , null
          , null);

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(entrant);
      });

      Assert.IsNotNull(_context.GetEntrant(_context.GetRace("r1")
        , entrant.DisplayName));

      Assert.IsNotNull(_context.GetEntrant(_context.GetRace("r1")
        , entrant.DisplayName.ToLower()));

      Assert.IsNotNull(_context.GetEntrant(_context.GetRace("r1")
        , entrant.DisplayName.ToUpper()));

      Assert.IsNull(_context.GetEntrant(_context.GetRace("r1"), "Bar"));
    }
  }
}
