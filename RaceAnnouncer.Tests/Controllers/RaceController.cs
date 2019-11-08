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
    public override void AddOrUpdate_Add_Duplicate_Keeps_Count()
    {
      int raceCount = _context.Races.Local.Count;
      _context.AddOrUpdate(RandomLocalRace);
      SaveChanges();
      Assert.AreEqual(raceCount, _context.Races.Local.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Increases_Count()
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
    public void GetRace_Returns_NULL()
    {
      Assert.IsNull(_context.GetRace(GenerateRace(RandomLocalGame).SrlId));
    }

    [Test]
    public void GetRace_Returns_Race()
    {
      Assert.IsNotNull(_context.GetRace(RandomLocalRace.SrlId));
    }
  }
}
