using NUnit.Framework;
using RaceAnnouncer.Bot.Data.Controllers;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.Tests.Controllers
{
  [System.Diagnostics.CodeAnalysis.SuppressMessage("Nullable", "CS8600:Converting null literal or possible null value to non-nullable type.", Justification = "Assertion")]
  [System.Diagnostics.CodeAnalysis.SuppressMessage("Nullable", "CS8602:Dereference of a possibly null reference.", Justification = "Assertion")]
  [System.Diagnostics.CodeAnalysis.SuppressMessage("Nullable", "CS8604:Possible null reference argument for parameter.", Justification = "Assertion")]
  public class AnnouncementController : BaseControllerTest
  {
    [SetUp]
    public override void _Setup()
    {
      ResetContext();
    }

    [Test]
    public override void AddOrUpdate_Add_Duplicate_Keeps_Count()
    {
      int announcementCount = _context.Announcements.Local.Count;
      _context.AddOrUpdate(RandomLocalAnnouncement);
      SaveChanges();
      Assert.AreEqual(announcementCount, _context.Announcements.Local.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Increases_Count()
    {
      int announcementCount = _context.Announcements.Local.Count;
      _context.AddOrUpdate(GenerateAnnouncement(RandomLocalTracker, RandomLocalRace));
      SaveChanges();
      Assert.AreEqual(announcementCount + 1, _context.Announcements.Local.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Stored_Correctly()
    {
      Announcement a1 = _context.AddOrUpdate(GenerateAnnouncement(RandomLocalTracker, RandomLocalRace));
      SaveChanges();

      Announcement a2 = _context.GetAnnouncement(
        _context.GetRace(a1.Race.SrlId)
        , _context.GetTracker(
          _context.GetGame(a1.Tracker.Game.Abbreviation)
          , _context.GetChannel(a1.Channel.Snowflake)));

      Assert.AreEqual(a1.Snowflake, a2.Snowflake);
      Assert.AreEqual(a1.Race.SrlId, a2.Race.SrlId);
      Assert.AreEqual(a1.Channel.Snowflake, a2.Channel.Snowflake);
    }

    [Test]
    public override void AssignAttributes_Assigns_All_Attributes()
    {
      Announcement a1 = GenerateAnnouncement(RandomLocalTracker, RandomLocalRace);
      Announcement a2 = RandomLocalAnnouncement;

      a2.AssignAttributes(a1);
      Assert.AreEqual(a1.Race.SrlId, a2.Race.SrlId);
      Assert.AreEqual(a1.Tracker.Channel.Snowflake, a2.Tracker.Channel.Snowflake);
      Assert.AreEqual(a1.Tracker.Game.Abbreviation, a2.Tracker.Game.Abbreviation);
      Assert.AreEqual(a1.Race.SrlId, a2.Race.SrlId);
      Assert.AreEqual(a1.Channel.Snowflake, a2.Channel.Snowflake);
    }

    [Test]
    public void GetAnnouncement_Returns_Announcement()
    {
      Announcement announcement = RandomLocalAnnouncement;
      Assert.AreSame(announcement, _context.GetAnnouncement(announcement.Race, announcement.Tracker));
    }

    [Test]
    public void GetAnnouncement_Returns_NULL()
    {
      Assert.IsNull(_context.GetAnnouncement(GenerateRace(GenerateGame()), RandomLocalTracker));
    }
  }
}
