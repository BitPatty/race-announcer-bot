using System;
using NUnit.Framework;
using RaceAnnouncer.Bot.Data.Controllers;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.Tests.Schema
{
  public class GameEntity : BaseTest
  {
    [Test]
    public void Abbreviation_Assign_Empty_Throws()
    {
      Game game = new Game("foo", "1", 1);

      Assert.Throws<ArgumentException>(delegate
      {
        game.Abbreviation = "";
      });
    }

    [Test]
    public void Abbreviation_Assign_Valid_Does_Not_Throw()
    {
      Game game = new Game("foo", "1", 1);

      Assert.DoesNotThrow(delegate
      {
        game.Abbreviation = "foo";
      });
    }

    [Test]
    public void Abbreviation_Assign_Whitespace_Throws()
    {
      Game game = new Game("foo", "1", 1);

      Assert.Throws<ArgumentException>(delegate
      {
        game.Abbreviation = "    ";
      });
    }

    [Test]
    public void Abbreviation_Init_Empty_Throws()
    {
      Assert.Throws<ArgumentException>(delegate
      {
        new Game("", "1", 1);
      });
    }

    [Test]
    public void Abbreviation_Init_Whitespace_Throws()
    {
      Assert.Throws<ArgumentException>(delegate
      {
        new Game("    ", "1", 1);
      });
    }

    [Test]
    public void Name_Assign_Empty_Throws()
    {
      Game game = new Game("foo", "1", 1);

      Assert.Throws<ArgumentException>(delegate
      {
        game.Name = "";
      });
    }

    [Test]
    public void Name_Assign_Valid_Does_Not_Throw()
    {
      Game game = new Game("foo", "1", 1);

      Assert.DoesNotThrow(delegate
      {
        game.Name = "foo";
      });
    }

    [Test]
    public void Name_Assign_Whitespace_Throws()
    {
      Game game = new Game("foo", "1", 1);

      Assert.Throws<ArgumentException>(delegate
      {
        game.Name = "    ";
      });
    }

    [Test]
    public void Name_Init_Empty_Throws()
    {
      Assert.Throws<ArgumentException>(delegate
      {
        new Game("foo", "", 1);
      });
    }

    [Test]
    public void Name_Init_Whitespace_Throws()
    {
      Assert.Throws<ArgumentException>(delegate
      {
        new Game("foo", "    ", 1);
      });
    }

    [SetUp]
    public void Setup()
    {
      ResetContext();
    }

    [Test]
    public void Timestamp_CreatedAt()
    {
      Game? game = GenerateGame();
      _context.Add(game);
      SaveChanges();
      game = _context.GetGame(game.Abbreviation);

      Assert.IsNotNull(game);
      Assert.IsNotNull(game?.CreatedAt);
      Assert.AreNotEqual(DateTime.MinValue, game?.CreatedAt);
      Assert.Greater(DateTime.Now, game?.CreatedAt);
    }

    [Test]
    public void Timestamp_UpdatedAt()
    {
      Game? game = RandomLocalGame;
      DateTime updatedAt = game.UpdatedAt;
      game.Name = $"{Ticks}";
      SaveChanges();
      game = _context.GetGame(game.Abbreviation);

      Assert.IsNotNull(game);
      Assert.IsNotNull(game?.UpdatedAt);
      Assert.AreNotEqual(DateTime.MinValue, game?.UpdatedAt);
      Assert.Greater(game.UpdatedAt, updatedAt);
      Assert.Greater(DateTime.Now, game.UpdatedAt);
    }
  }
}
