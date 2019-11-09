using NUnit.Framework;
using RaceAnnouncer.Bot.Data.Controllers;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.Tests.Controllers
{
  [System.Diagnostics.CodeAnalysis.SuppressMessage("Nullable", "CS8600:Converting null literal or possible null value to non-nullable type.", Justification = "Assertion")]
  [System.Diagnostics.CodeAnalysis.SuppressMessage("Nullable", "CS8602:Dereference of a possibly null reference.", Justification = "Assertion")]
  [System.Diagnostics.CodeAnalysis.SuppressMessage("Nullable", "CS8604:Possible null reference argument for parameter.", Justification = "Assertion")]
  public class GameController : BaseControllerTest
  {
    [SetUp]
    public override void _Setup()
    {
      ResetContext();
    }

    [Test]
    public override void AddOrUpdate_Add_Duplicate_Keeps_Collection_Count_After_Save()
    {
      Assert.Pass("Not applicable");
    }

    [Test]
    public override void AddOrUpdate_Add_Duplicate_Keeps_Collection_Count_Before_Save()
    {
      Assert.Pass("Not applicable");
    }

    [Test]
    public override void AddOrUpdate_Add_Duplicate_Keeps_Total_Count_After_Save()
    {
      int gameCount = _context.Games.Local.Count;
      Game game = RandomLocalGame;

      _context.AddOrUpdate(game);
      SaveChanges();

      Assert.AreEqual(gameCount, _context.Games.Local.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Duplicate_Keeps_Total_Count_Before_Save()
    {
      int gameCount = _context.Games.Local.Count;
      Game game = RandomLocalGame;
      _context.AddOrUpdate(game);

      Assert.AreEqual(gameCount, _context.Games.Local.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Increases_Collection_Count_After_Save()
    {
      Assert.Pass("Not applicable");
    }

    [Test]
    public override void AddOrUpdate_Add_Increases_Collection_Count_Before_Save()
    {
      Assert.Pass("Not applicable");
    }

    [Test]
    public override void AddOrUpdate_Add_Increases_Total_Count_After_Save()
    {
      int gameCount = _context.Games.Local.Count;
      Game game = GenerateGame();

      _context.AddOrUpdate(game);
      SaveChanges();

      Assert.AreEqual(gameCount + 1, _context.Games.Local.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Increases_Total_Count_Before_Save()
    {
      int gameCount = _context.Games.Local.Count;
      Game game = GenerateGame();
      _context.AddOrUpdate(game);

      Assert.AreEqual(gameCount + 1, _context.Games.Local.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Stored_Correctly()
    {
      Game g1 = GenerateGame();

      Assert.IsNull(_context.GetGame(g1.Abbreviation));

      _context.AddOrUpdate(g1);
      SaveChanges();

      Game g2 = _context.GetGame(g1.Abbreviation);

      Assert.AreEqual(g1.Abbreviation, g2.Abbreviation);
      Assert.AreEqual(g1.Name, g2.Name);
      Assert.AreEqual(g1.SrlId, g2.SrlId);
    }

    [Test]
    public override void AssignAttributes_Assigns_All_Attributes()
    {
      Game g1 = GenerateGame();
      Game g2 = GenerateGame();
      g2.AssignAttributes(g1);

      Assert.AreEqual(g1.Abbreviation, g2.Abbreviation);
      Assert.AreEqual(g1.Name, g2.Name);
      Assert.AreEqual(g1.SrlId, g2.SrlId);
    }

    [Test]
    public void GetGame_Returns_Game()
    {
      Game game = RandomLocalGame;

      Assert.AreSame(game, _context.GetGame(game.Abbreviation));
    }

    [Test]
    public void GetGame_Returns_Null()
    {
      Assert.IsNull(_context.GetGame(GenerateGame().Abbreviation));
    }
  }
}
