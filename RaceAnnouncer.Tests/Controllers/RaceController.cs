using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;
using RaceAnnouncer.Bot.Data.Controllers;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.Tests.Controllers
{
  [System.Diagnostics.CodeAnalysis.SuppressMessage("Nullable", "CS8600:Converting null literal or possible null value to non-nullable type.", Justification = "Assertion")]
  [System.Diagnostics.CodeAnalysis.SuppressMessage("Nullable", "CS8602:Dereference of a possibly null reference.", Justification = "Assertion")]
  [System.Diagnostics.CodeAnalysis.SuppressMessage("Nullable", "CS8604:Possible null reference argument for parameter.", Justification = "Assertion")]
  public class RaceController : BaseControllerTest
  {
    [SetUp]
    public override void _Setup()
    {
      ResetContext();
    }

    [Test]
    public override void AddOrUpdate_Add_Duplicate_Keeps_Collection_Count_After_Save()
    {
      Race race = RandomLocalRace;
      int cntGame = race.Game.Races.Count;
      _context.AddOrUpdate(race);
      SaveChanges();
      Game? game = _context.GetGame(race.Game.Abbreviation);

      Assert.IsNotNull(game);
      Assert.AreEqual(cntGame, game.Races.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Duplicate_Keeps_Collection_Count_Before_Save()
    {
      Race race = RandomLocalRace;
      int cntGame = race.Game.Races.Count;
      _context.AddOrUpdate(race);

      Assert.AreEqual(cntGame, race.Game.Races.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Duplicate_Keeps_Total_Count_After_Save()
    {
      int raceCount = _context.Races.Local.Count;
      _context.AddOrUpdate(RandomLocalRace);
      SaveChanges();

      Assert.AreEqual(raceCount, _context.Races.Local.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Duplicate_Keeps_Total_Count_Before_Save()
    {
      int raceCount = _context.Races.Local.Count;
      _context.AddOrUpdate(RandomLocalRace);

      Assert.AreEqual(raceCount, _context.Races.Local.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Increases_Collection_Count_After_Save()
    {
      Game? game = RandomLocalGame;
      int cntGame = game.Races.Count;
      Race race = GenerateRace(game);
      _context.AddOrUpdate(race);
      SaveChanges();
      game = _context.GetGame(game.Abbreviation);

      Assert.IsNotNull(game);
      Assert.AreEqual(cntGame + 1, game.Races.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Increases_Collection_Count_Before_Save()
    {
      Game? game = RandomLocalGame;
      int cntGame = game.Races.Count;
      Race race = GenerateRace(game);
      _context.AddOrUpdate(race);

      Assert.IsNotNull(game);
      Assert.AreEqual(cntGame + 1, game.Races.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Increases_Total_Count_After_Save()
    {
      int raceCount = _context.Races.Local.Count;
      _context.AddOrUpdate(GenerateRace(RandomLocalGame));

      Assert.AreEqual(raceCount + 1, _context.Races.Local.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Increases_Total_Count_Before_Save()
    {
      int raceCount = _context.Races.Local.Count;
      _context.AddOrUpdate(GenerateRace(RandomLocalGame));
      SaveChanges();

      Assert.AreEqual(raceCount + 1, _context.Races.Local.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Stored_Correctly()
    {
      Race c1 = _context.AddOrUpdate(GenerateRace(RandomLocalGame));
      SaveChanges();

      Race c2 = _context.GetRace(c1.SrlId);
      Assert.AreEqual(c1.IsActive, c2.IsActive);
      Assert.AreEqual(c1.Game.Abbreviation, c2.Game.Abbreviation);
      Assert.AreEqual(c1.Goal, c2.Goal);
      Assert.AreEqual(c1.State, c2.State);
      Assert.AreEqual(c1.Time, c2.Time);
    }

    [Test]
    public override void AssignAttributes_Assigns_All_Attributes()
    {
      Race c1 = GenerateRace(RandomLocalGame);
      Race c2 = RandomLocalRace;

      c2.AssignAttributes(c1);
      Assert.AreEqual(c1.IsActive, c2.IsActive);
      Assert.AreEqual(c1.Game.Abbreviation, c2.Game.Abbreviation);
      Assert.AreEqual(c1.Goal, c2.Goal);
      Assert.AreEqual(c1.State, c2.State);
      Assert.AreEqual(c1.Time, c2.Time);
    }

    [Test]
    public void GetEntrants_Returns_Entrants()
    {
      Race race = RandomLocalEntrant.Race;
      IEnumerable<Entrant> entrants = _context.GetEntrants(race);

      Assert.AreNotSame(race.Entrants, entrants);
      Assert.AreEqual(race.Entrants.Count, entrants.Count());

      foreach (Entrant e in race.Entrants)
        Assert.Contains(e, entrants.ToList());
    }

    [Test]
    public void GetRace_Returns_NULL()
    {
      Assert.IsNull(_context.GetRace(GenerateRace(RandomLocalGame).SrlId));
    }

    [Test]
    public void GetRace_Returns_Race()
    {
      Race race = RandomLocalRace;
      Assert.AreSame(race, _context.GetRace(race.SrlId));
    }
  }
}
