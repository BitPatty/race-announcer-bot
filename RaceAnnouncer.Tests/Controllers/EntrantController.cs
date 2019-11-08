using NUnit.Framework;
using RaceAnnouncer.Bot.Data.Controllers;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.Tests.Controllers
{
  [System.Diagnostics.CodeAnalysis.SuppressMessage("Nullable", "CS8600:Converting null literal or possible null value to non-nullable type.", Justification = "Assertion")]
  [System.Diagnostics.CodeAnalysis.SuppressMessage("Nullable", "CS8602:Dereference of a possibly null reference.", Justification = "Assertion")]
  [System.Diagnostics.CodeAnalysis.SuppressMessage("Nullable", "CS8604:Possible null reference argument for parameter.", Justification = "Assertion")]
  public class EntrantController : BaseControllerTest
  {
    [SetUp]
    public override void _Setup()
    {
      ResetContext();
    }

    [Test]
    public override void AddOrUpdate_Add_Duplicate_Keeps_Count()
    {
      int entrantCount = _context.Entrants.Local.Count;
      _context.AddOrUpdate(RandomLocalEntrant);
      SaveChanges();

      Assert.AreEqual(entrantCount, _context.Entrants.Local.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Increases_Count()
    {
      int entrantCount = _context.Entrants.Local.Count;
      Entrant entrant = GenerateEntrant(RandomLocalRace);
      _context.AddOrUpdate(entrant);
      SaveChanges();

      Assert.AreEqual(entrantCount + 1, _context.Entrants.Local.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Stored_Correctly()
    {
      Entrant e1 = GenerateEntrant(RandomLocalRace);
      _context.AddOrUpdate(e1);
      SaveChanges();

      Entrant e2 = _context.GetEntrant(_context.GetRace(e1.Race.SrlId), e1.DisplayName);

      Assert.AreEqual(e1.DisplayName, e2.DisplayName);
      Assert.AreEqual(e1.State, e2.State);
      Assert.AreEqual(e1.Place, e2.Place);
      Assert.AreEqual(e1.Race.SrlId, e2.Race.SrlId);
      Assert.AreEqual(e1.Time, e2.Time);
    }

    [Test]
    public override void AssignAttributes_Assigns_All_Attributes()
    {
      Entrant e1 = GenerateEntrant(RandomLocalRace);
      Entrant e2 = RandomLocalEntrant;

      e2.AssignAttributes(e1);

      Assert.AreEqual(e1.DisplayName, e2.DisplayName);
      Assert.AreEqual(e1.State, e2.State);
      Assert.AreEqual(e1.Place, e2.Place);
      Assert.AreEqual(e1.Race.SrlId, e2.Race.SrlId);
      Assert.AreEqual(e1.Time, e2.Time);
    }

    [Test]
    public void DeleteEntrant_Removes_Entrant()
    {
      Entrant entrant = RandomLocalEntrant;

      _context.DeleteEntrant(entrant);
      SaveChanges();

      Assert.IsNotNull(entrant);
      Assert.IsNull(_context.GetEntrant(_context.GetRace(entrant.Race.SrlId), entrant.DisplayName));
    }

    [Test]
    public void GetEntrant_Returns_Entrant()
    {
      Entrant entrant = RandomLocalEntrant;
      Assert.AreSame(entrant, _context.GetEntrant(entrant.Race, entrant.DisplayName));
    }

    [Test]
    public void GetEntrant_Returns_NULL()
    {
      Assert.IsNull(_context.GetEntrant(RandomLocalRace, $"{Ticks}"));
    }
  }
}
