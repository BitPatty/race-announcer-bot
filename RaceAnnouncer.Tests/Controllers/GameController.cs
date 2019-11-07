using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using RaceAnnouncer.Tests.TestHelpers;
using RaceAnnouncer.Schema.Models;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Bot.Data.Controllers;

namespace RaceAnnouncer.Tests.Controllers
{
  public class GameController
  {
    private DatabaseContext _context = ContextHelper.GetContext();

    [SetUp]
    public void Setup()
    {
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
        , _context.Games.Count());
    }

    [Test]
    public void AddOrUpdate_Add_One()
    {
      ResetDatabase();
      ResetContext();

      Game game = new Game("foo", "1", 1);

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(game);
      });

      Assert.AreEqual(1
        , _context.Games.Local.Count);

      Assert.AreSame(game
        , _context.Games.Local.First());

      Assert.AreEqual(EntityState.Added
        , _context.Entry(game).State);

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      ResetContext();

      Assert.AreEqual(1
        , _context.Games.Local.Count);

      Assert.AreNotSame(game
        , _context.Games.Local.First());

      Assert.AreEqual(game.Abbreviation
        , _context.Games.First().Abbreviation);

      Assert.AreEqual(game.Name
        , _context.Games.First().Name);

      Assert.AreEqual(game.SrlId
        , _context.Games.First().SrlId);
    }

    [Test]
    public void AddOrUpdate_Add_Two()
    {
      ResetDatabase();
      ResetContext();

      Game game1 = new Game("foo", "1", 1);
      _context.AddOrUpdate(game1);

      Game game2 = new Game("bar", "2", 2);
      _context.AddOrUpdate(game2);

      Assert.AreEqual(2
        , _context.Games.Local.Count);

      Assert.AreEqual(EntityState.Added
        , _context.Entry(game1).State);

      Assert.AreEqual(EntityState.Added
        , _context.Entry(game2).State);

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      ResetContext();

      Assert.AreEqual(2
        , _context.Games.Local.Count);
    }

    [Test]
    public void AddOrUpdate_Convert_Abbreviation()
    {
      ResetDatabase();
      ResetContext();

      Game game = new Game("FoO", "1", 1);
      game = _context.AddOrUpdate(game);

      Assert.AreEqual("FoO"
        , game.Abbreviation);

      Assert.AreEqual(1
        , _context.Games.Local.Count);

      Assert.AreSame(game
        , _context.Games.Local.First());

      Assert.AreEqual(EntityState.Added
        , _context.Entry(game).State);

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      Assert.AreSame(game
        , _context.Games.Local.First());

      Assert.AreEqual("FoO"
        , game.Abbreviation);

      ResetContext();

      Assert.AreEqual(1
        , _context.Games.Local.Count);

      Assert.AreNotSame(game
        , _context.Games.Local.First());

      Assert.AreEqual("foo"
        , _context.Games.Local.First().Abbreviation);
    }

    [Test]
    public void GetGame_CI_Abbreviation()
    {
      ResetDatabase();
      ResetContext();

      Assert.DoesNotThrow(delegate
      {
        _context.Add(new Game("FoO", "1", 1));
      });

      Assert.AreSame(_context.Games.Local.First()
        , _context.GetGame("fOO"));
    }

    [Test]
    public void AddOrUpdate_CI_Duplicate_Abbreviation()
    {
      ResetDatabase();
      ResetContext();

      Game game1 = new Game("foo", "1", 1);
      game1 = _context.AddOrUpdate(game1);

      Assert.AreEqual(1
        , _context.Games.Local.Count);

      Assert.AreSame(game1
        , _context.Games.Local.First());

      Assert.AreEqual(EntityState.Added
        , _context.Entry(game1).State);

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      Assert.AreSame(game1
        , _context.Games.Local.First());

      Game game2 = new Game("FOO", "2", 1);
      game2 = _context.AddOrUpdate(game2);

      Assert.AreEqual(1
        , _context.Games.Local.Count);

      Assert.AreEqual(EntityState.Unchanged
        , _context.Entry(game2).State);

      Assert.DoesNotThrow(delegate
      {
        _context.ChangeTracker.DetectChanges();
      });

      Assert.AreEqual(EntityState.Modified
        , _context.Entry(game2).State);

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      ResetContext();

      Assert.AreEqual(1
        , _context.Games.Local.Count);

      Assert.AreNotSame(game1
        , _context.Games.Local.First());

      Assert.AreNotSame(game2
        , _context.Games.Local.First());

      Assert.AreEqual("foo"
        , _context.Games.Local.First().Abbreviation);
    }

    [Test]
    public void AssignAttributes()
    {
      Game game1 = new Game("foo", "1", 1);
      Game game2 = new Game("bar", "2", 2);

      Assert.DoesNotThrow(delegate
      {
        game1.AssignAttributes(game2);
      });

      Assert.AreEqual(game2.Abbreviation
        , game1.Abbreviation);

      Assert.AreEqual(game2.Name
        , game1.Name);

      Assert.AreEqual(game2.SrlId
        , game1.SrlId);
    }
  }
}
