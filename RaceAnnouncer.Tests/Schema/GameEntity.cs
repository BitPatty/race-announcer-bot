using System;
using NUnit.Framework;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Bot.Data;
using RaceAnnouncer.Schema.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using RaceAnnouncer.Tests.Helpers;

namespace RaceAnnouncer.Tests.Schema
{
  public class GameEntity
  {
    private DatabaseContext _context = ContextHelper.GetContext();

    [SetUp]
    public void Setup()
    {
      ResetContext();
    }

    public void ResetContext()
    {
      Assert.DoesNotThrow(delegate { ContextHelper.ResetContext(ref _context); });
    }

    public void ResetDatabase()
    {
      Assert.DoesNotThrow(delegate { ContextHelper.ResetDatabase(_context); });
      Assert.AreEqual(0, _context.Games.Count());
    }

    [Test]
    public void Game_Add()
    {
      ResetDatabase();

      const string abbreviation = "foo";
      const string name = "bar";
      const int srlId = 1;

      Game game1 = new Game(abbreviation, name, srlId);
      Game? game2 = null;

      // Add game
      Assert.DoesNotThrow(delegate { _context.Games.Add(game1); });
      Assert.DoesNotThrow(delegate { _context.Entry(game1).State = EntityState.Added; });
      Assert.DoesNotThrow(delegate { _context.SaveChanges(); });

      // Load game
      Assert.AreEqual(1, _context.Games.Where(g => g.Abbreviation.Equals(game1.Abbreviation)).Count());
      Assert.DoesNotThrow(delegate { game2 = _context.Games.First(e => e.Abbreviation.Equals(game1.Abbreviation)); });
      Assert.NotNull(game2);

      // Check immutable state of game1
      Assert.AreEqual(abbreviation, game1.Abbreviation);
      Assert.AreEqual(name, game1.Name);
      Assert.AreEqual(srlId, game1.SrlId);

      // Compare game1 and game2
      Assert.AreEqual(game1.Name, game2?.Name);
      Assert.AreEqual(game1.Id, game2?.Id);
      Assert.AreEqual(game1.SrlId, game2?.SrlId);
    }

    #region Duplicates

    [Test]
    public void Abbreviation_Duplicate_With_Metadata()
    {
      Game game1 = new Game("foo", "1", 1);
      Game game2 = new Game("foo", "2", 2);

      Assert.DoesNotThrow(delegate { _context.Games.Add(game1); });
      Assert.Throws<InvalidOperationException>(delegate { _context.Games.Add(game2); });
    }

    [Test]
    public void Abbreviation_Duplicate_Without_Metadata()
    {
      ResetDatabase();

      Game game1 = new Game("foo", "1", 1);

      Assert.DoesNotThrow(delegate { _context.Games.Add(game1); });
      Assert.DoesNotThrow(delegate { _context.Entry(game1).State = EntityState.Added; });
      Assert.DoesNotThrow(delegate { _context.SaveChanges(); });

      ResetContext();

      Game game2 = new Game("foo", "2", 2);

      Assert.DoesNotThrow(delegate { _context.Games.Add(game1); });
      Assert.DoesNotThrow(delegate { _context.Entry(game1).State = EntityState.Added; });
      Assert.Throws<DbUpdateException>(delegate { _context.SaveChanges(); });
    }

    [Test]
    public void Name_Duplicate_Without_Metadata()
    {
      ResetDatabase();

      Game game1 = new Game("foo", "1", 1);

      Assert.DoesNotThrow(delegate { _context.Games.Add(game1); });
      Assert.DoesNotThrow(delegate { _context.Entry(game1).State = EntityState.Added; });
      Assert.DoesNotThrow(delegate { _context.SaveChanges(); });

      ResetContext();

      Game game2 = new Game("foo", "1", 2);

      Assert.DoesNotThrow(delegate { _context.Games.Add(game2); });
      Assert.DoesNotThrow(delegate { _context.Entry(game2).State = EntityState.Added; });
      Assert.Throws<DbUpdateException>(delegate { _context.SaveChanges(); });
    }

    [Test]
    public void SrlId_Duplicate_With_Metadata()
    {
      ResetContext();

      Game game1 = new Game("foo", "1", 1);
      Game game2 = new Game("bar", "2", 1);

      Assert.DoesNotThrow(delegate { _context.Games.Add(game1); });
      Assert.Throws<InvalidOperationException>(delegate { _context.Games.Add(game2); });
    }

    [Test]
    public void SrlId_Duplicate_Without_Metadata()
    {
      ResetDatabase();

      Game game1 = new Game("foo", "1", 1);

      Assert.DoesNotThrow(delegate { _context.Games.Add(game1); });
      Assert.DoesNotThrow(delegate { _context.Entry(game1).State = EntityState.Added; });
      Assert.DoesNotThrow(delegate { _context.SaveChanges(); });

      ResetContext();

      Game game2 = new Game("bar", "2", 1);

      Assert.DoesNotThrow(delegate { _context.Games.Add(game1); });
      Assert.DoesNotThrow(delegate { _context.Entry(game1).State = EntityState.Added; });
      Assert.Throws<DbUpdateException>(delegate { _context.SaveChanges(); });
    }

    #endregion Duplicates

    #region Abbreviation
    [Test]
    [Parallelizable]
    public void Abbreviation_Init_Empty()
    {
      Assert.Throws<ArgumentException>(delegate { new Game("", "1", 1); });
    }

    [Test]
    [Parallelizable]
    public void Abbreviation_Init_Whitespace()
    {
      Assert.Throws<ArgumentException>(delegate { new Game("    ", "1", 1); });
    }

    [Test]
    [Parallelizable]
    public void Abbreviation_Assign_Valid()
    {
      Game game1 = new Game("foo", "1", 1);
      Assert.DoesNotThrow(delegate { game1.Abbreviation = "foo"; });
    }

    [Test]
    [Parallelizable]
    public void Abbreviation_Assign_Empty()
    {
      Game game1 = new Game("foo", "1", 1);
      Assert.Throws<ArgumentException>(delegate { game1.Abbreviation = ""; });
    }

    [Test]
    [Parallelizable]
    public void Abbreviation_Assign_Whitespace()
    {
      Game game1 = new Game("foo", "1", 1);
      Assert.Throws<ArgumentException>(delegate { game1.Abbreviation = "    "; });
    }

    #endregion Abbreviation

    #region Name

    [Test]
    [Parallelizable]
    public void Name_Init_Empty()
    {
      Assert.Throws<ArgumentException>(delegate { new Game("foo", "", 1); });
    }

    [Test]
    [Parallelizable]
    public void Name_Init_Whitespace()
    {
      Assert.Throws<ArgumentException>(delegate { new Game("foo", "    ", 1); });
    }

    [Test]
    [Parallelizable]
    public void Name_Assign_Valid()
    {
      Game game1 = new Game("foo", "1", 1);
      Assert.DoesNotThrow(delegate { game1.Name = "foo"; });
    }

    [Test]
    [Parallelizable]
    public void Name_Assign_Empty()
    {
      Game game1 = new Game("foo", "1", 1);
      Assert.Throws<ArgumentException>(delegate { game1.Name = ""; });
    }

    [Test]
    [Parallelizable]
    public void Name_Assign_Whitespace()
    {
      Game game1 = new Game("foo", "1", 1);
      Assert.Throws<ArgumentException>(delegate { game1.Name = "    "; });
    }

    [TearDown]
    public void CleanUp()
    {
      _context.Dispose();
    }

    #endregion Name
  }
}
