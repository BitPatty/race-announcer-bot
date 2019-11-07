using System;
using NUnit.Framework;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Schema.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using RaceAnnouncer.Tests.TestHelpers;

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
      Assert.DoesNotThrow(delegate
      {
        ContextHelper.ResetContext(ref _context);
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
    public void Game_Add()
    {
      ResetDatabase();

      const string abbreviation = "foo";
      const string name = "bar";
      const int srlId = 1;

      Game game1 =
        new Game(
          abbreviation
          , name
          , srlId);

      Game? game2 = null;

      Assert.DoesNotThrow(delegate
      {
        _context.Games.Add(game1);
      });

      Assert.DoesNotThrow(delegate
      {
        _context.Entry(game1).State = EntityState.Added;
      });

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      Assert.AreEqual(1
        , _context
          .Games
          .Where(g => g.Abbreviation.Equals(game1.Abbreviation))
          .Count());

      Assert.DoesNotThrow(delegate
      {
        game2 =
          _context
            .Games
            .First(e => e.Abbreviation.Equals(game1.Abbreviation));
      });

      Assert.NotNull(game2);

      Assert.AreEqual(abbreviation
        , game1.Abbreviation);

      Assert.AreEqual(name
        , game1.Name);

      Assert.AreEqual(srlId
        , game1.SrlId);

      Assert.AreEqual(game1.Name
        , game2?.Name);

      Assert.AreEqual(game1.Id
        , game2?.Id);

      Assert.AreEqual(game1.SrlId
        , game2?.SrlId);
    }

    [Test]
    public void Timestamp_CreatedAt()
    {
      ResetDatabase();

      Game game = new Game("foo", "1", 1);

      Assert.AreEqual(DateTime.MinValue
        , game.CreatedAt);

      Assert.DoesNotThrow(delegate
      {
        _context.Games.Add(game);
      });

      Assert.AreEqual(DateTime.MinValue
        , game.CreatedAt);

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      Assert.AreNotEqual(DateTime.MinValue
        , game.CreatedAt);

      Assert.Greater(DateTime.Now.Subtract(game.CreatedAt)
        , TimeSpan.FromSeconds(0));

      Assert.Less(DateTime.Now.Subtract(game.CreatedAt)
        , TimeSpan.FromSeconds(60));

      Assert.Less(DateTime.UtcNow.Subtract(game.CreatedAt)
        , TimeSpan.FromSeconds(60));
    }

    [Test]
    public void Timestamp_UpdatedAt()
    {
      ResetDatabase();

      Game game = new Game("foo", "1", 1);

      Assert.AreEqual(DateTime.MinValue
        , game.CreatedAt);

      Assert.DoesNotThrow(delegate
      {
        _context.Games.Add(game);
      });

      Assert.AreEqual(DateTime.MinValue
        , game.UpdatedAt);

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      Assert.AreNotEqual(DateTime.MinValue
        , game.UpdatedAt);

      Assert.AreEqual(game.CreatedAt
        , game.UpdatedAt);

      Assert.Greater(DateTime.Now.Subtract(game.UpdatedAt)
        , TimeSpan.FromSeconds(0));

      Assert.Less(DateTime.Now.Subtract(game.UpdatedAt)
        , TimeSpan.FromSeconds(60));

      Assert.Less(DateTime.UtcNow.Subtract(game.UpdatedAt)
        , TimeSpan.FromSeconds(60));

      DateTime updatedAt = game.UpdatedAt;

      Assert.DoesNotThrow(delegate
      {
        game.Name = "2";
      });

      Assert.AreEqual(updatedAt
        , game.UpdatedAt);

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      Assert.AreNotEqual(game.CreatedAt
        , game.UpdatedAt);

      Assert.Greater(DateTime.Now.Subtract(game.UpdatedAt)
        , TimeSpan.FromSeconds(0));

      Assert.Less(DateTime.Now.Subtract(game.UpdatedAt)
        , TimeSpan.FromSeconds(60));

      Assert.Less(DateTime.UtcNow.Subtract(game.UpdatedAt)
        , TimeSpan.FromSeconds(60));

      Assert.Greater(game.UpdatedAt.Subtract(game.CreatedAt)
        , TimeSpan.FromSeconds(0));

      Assert.Less(game.UpdatedAt.Subtract(game.CreatedAt)
        , TimeSpan.FromSeconds(60));
    }

    #region Duplicates

    [Test]
    public void Abbreviation_Duplicate_With_Metadata()
    {
      Game game1 = new Game("foo", "1", 1);
      Game game2 = new Game("foo", "2", 2);

      Assert.DoesNotThrow(delegate
      {
        _context.Games.Add(game1);
      });

      Assert.AreEqual(EntityState.Added
        , _context.Entry(game1).State);

      Assert.Throws<InvalidOperationException>(delegate
      {
        _context.Games.Add(game2);
      });
    }

    [Test]
    public void Abbreviation_Duplicate_CI_With_Metadata()
    {
      Game game1 = new Game("foo", "1", 1);
      Game game2 = new Game("FOO", "2", 2);

      Assert.DoesNotThrow(delegate
      {
        _context.Games.Add(game1);
      });

      Assert.AreEqual(EntityState.Added
        , _context.Entry(game1).State);

      Assert.DoesNotThrow(delegate
      {
        _context.Games.Add(game2);
      });

      Assert.AreEqual(EntityState.Added
        , _context.Entry(game2).State);

      Assert.Throws<DbUpdateException>(delegate
      {
        _context.SaveChanges();
      });
    }

    [Test]
    public void Abbreviation_Duplicate_Without_Metadata()
    {
      ResetDatabase();

      Game game1 = new Game("foo", "1", 1);

      Assert.DoesNotThrow(delegate
      {
        _context.Games.Add(game1);
      });

      Assert.AreEqual(EntityState.Added
        , _context.Entry(game1).State);

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      ResetContext();

      Game game2 = new Game("foo", "2", 2);

      Assert.DoesNotThrow(delegate
      {
        _context.Games.Add(game1);
      });

      Assert.AreEqual(EntityState.Added
        , _context.Entry(game1).State);

      Assert.Throws<DbUpdateException>(delegate
      {
        _context.SaveChanges();
      });
    }

    [Test]
    public void Abbreviation_Duplicate_CI_Without_Metadata()
    {
      ResetDatabase();

      Game game1 = new Game("foo", "1", 1);

      Assert.DoesNotThrow(delegate
      {
        _context.Games.Add(game1);
      });

      Assert.AreEqual(EntityState.Added
        , _context.Entry(game1).State);

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      ResetContext();

      Game game2 = new Game("FOO", "2", 2);

      Assert.DoesNotThrow(delegate
      {
        _context.Games.Add(game1);
      });

      Assert.AreEqual(EntityState.Added
        , _context.Entry(game1).State);

      Assert.Throws<DbUpdateException>(delegate
      {
        _context.SaveChanges();
      });
    }

    [Test]
    public void Name_Duplicate_Without_Metadata()
    {
      ResetDatabase();

      Game game1 = new Game("foo", "1", 1);

      Assert.DoesNotThrow(delegate
      {
        _context.Games.Add(game1);
      });

      Assert.AreEqual(EntityState.Added
        , _context.Entry(game1).State);

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      ResetContext();

      Game game2 = new Game("bar", "1", 2);

      Assert.DoesNotThrow(delegate
      {
        _context.Games.Add(game2);
      });

      Assert.AreEqual(EntityState.Added
        , _context.Entry(game2).State);

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });
    }

    public void SrlId_Duplicate_With_Metadata()
    {
      ResetContext();

      Game game1 = new Game("foo", "1", 1);
      Game game2 = new Game("bar", "2", 1);

      Assert.DoesNotThrow(delegate
      {
        _context.Games.Add(game1);
      });

      Assert.Throws<InvalidOperationException>(delegate
      {
        _context.Games.Add(game2);
      });
    }

    [Test]
    public void SrlId_Duplicate_Without_Metadata()
    {
      ResetDatabase();

      Game game1 = new Game("foo", "1", 1);

      Assert.DoesNotThrow(delegate
      {
        _context.Games.Add(game1);
      });

      Assert.AreEqual(EntityState.Added
        , _context.Entry(game1).State);

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      ResetContext();

      Game game2 = new Game("bar", "2", 1);

      Assert.DoesNotThrow(delegate
      {
        _context.Games.Add(game1);
      });

      Assert.AreEqual(EntityState.Added
        , _context.Entry(game1).State);

      Assert.Throws<DbUpdateException>(delegate
      {
        _context.SaveChanges();
      });
    }

    #endregion Duplicates

    #region Abbreviation
    [Test]
    [Parallelizable]
    public void Abbreviation_Init_Empty()
    {
      Assert.Throws<ArgumentException>(delegate
      {
        new Game("", "1", 1);
      });
    }

    [Test]
    [Parallelizable]
    public void Abbreviation_Init_Whitespace()
    {
      Assert.Throws<ArgumentException>(delegate
      {
        new Game("    ", "1", 1);
      });
    }

    [Test]
    [Parallelizable]
    public void Abbreviation_Assign_Valid()
    {
      Game game1 = new Game("foo", "1", 1);

      Assert.DoesNotThrow(delegate
      {
        game1.Abbreviation = "foo";
      });
    }

    [Test]
    [Parallelizable]
    public void Abbreviation_Assign_Empty()
    {
      Game game1 = new Game("foo", "1", 1);

      Assert.Throws<ArgumentException>(delegate
      {
        game1.Abbreviation = "";
      });
    }

    [Test]
    [Parallelizable]
    public void Abbreviation_Assign_Whitespace()
    {
      Game game1 = new Game("foo", "1", 1);

      Assert.Throws<ArgumentException>(delegate
      {
        game1.Abbreviation = "    ";
      });
    }

    #endregion Abbreviation

    #region Name

    [Test]
    [Parallelizable]
    public void Name_Init_Empty()
    {
      Assert.Throws<ArgumentException>(delegate
      {
        new Game("foo", "", 1);
      });
    }

    [Test]
    [Parallelizable]
    public void Name_Init_Whitespace()
    {
      Assert.Throws<ArgumentException>(delegate
      {
        new Game("foo", "    ", 1);
      });
    }

    [Test]
    [Parallelizable]
    public void Name_Assign_Valid()
    {
      Game game1 = new Game("foo", "1", 1);

      Assert.DoesNotThrow(delegate
      {
        game1.Name = "foo";
      });
    }

    [Test]
    [Parallelizable]
    public void Name_Assign_Empty()
    {
      Game game1 = new Game("foo", "1", 1);

      Assert.Throws<ArgumentException>(delegate
      {
        game1.Name = "";
      });
    }

    [Test]
    [Parallelizable]
    public void Name_Assign_Whitespace()
    {
      Game game1 = new Game("foo", "1", 1);

      Assert.Throws<ArgumentException>(delegate
      {
        game1.Name = "    ";
      });
    }

    [TearDown]
    public void CleanUp()
    {
      _context.Dispose();
    }

    #endregion Name
  }
}
