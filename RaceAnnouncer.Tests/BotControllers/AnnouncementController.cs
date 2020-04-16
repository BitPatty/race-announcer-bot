using NUnit.Framework;
using RaceAnnouncer.Bot.Data.Controllers;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.Tests.BotControllers
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
    public override void AddOrUpdate_Add_Duplicate_Keeps_Collection_Count_After_Save()
    {
      Announcement announcement = RandomLocalAnnouncement;

      int cntChannel = announcement.Channel.Announcements.Count;
      int cntTracker = announcement.Tracker.Announcements.Count;
      int cntRace = announcement.Race.Announcements.Count;

      _context.AddOrUpdate(announcement);

      SaveChanges();
      ResetContext();

      Tracker tracker = _context.GetTracker(
        _context.GetGame(announcement.Tracker.Game.Abbreviation)
        , _context.GetChannel(announcement.Tracker.Channel.Snowflake));

      Race race = _context.GetRace(announcement.Race.SrlId);

      Announcement? dbAnnouncement = _context.GetAnnouncement(race, tracker);

      Assert.IsNotNull(dbAnnouncement);
      Assert.AreEqual(cntChannel, dbAnnouncement.Channel.Announcements.Count);
      Assert.AreEqual(cntRace, race.Announcements.Count);
      Assert.AreEqual(cntTracker, tracker.Announcements.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Duplicate_Keeps_Collection_Count_Before_Save()
    {
      Announcement announcement = RandomLocalAnnouncement;

      int cntChannel = announcement.Channel.Announcements.Count;
      int cntTracker = announcement.Tracker.Announcements.Count;
      int cntRace = announcement.Race.Announcements.Count;

      _context.AddOrUpdate(announcement);

      Assert.AreEqual(cntChannel, announcement.Channel.Announcements.Count);
      Assert.AreEqual(cntRace, announcement.Race.Announcements.Count);
      Assert.AreEqual(cntTracker, announcement.Tracker.Announcements.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Duplicate_Keeps_Total_Count_After_Save()
    {
      int announcementCount = _context.Announcements.Local.Count;
      _context.AddOrUpdate(RandomLocalAnnouncement);
      SaveChanges();

      Assert.AreEqual(announcementCount, _context.Announcements.Local.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Duplicate_Keeps_Total_Count_Before_Save()
    {
      int announcementCount = _context.Announcements.Local.Count;
      _context.AddOrUpdate(RandomLocalAnnouncement);

      Assert.AreEqual(announcementCount, _context.Announcements.Local.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Increases_Collection_Count_After_Save()
    {
      Announcement announcement = GenerateAnnouncement(RandomLocalActiveTracker, RandomLocalRace);

      int cntChannel = announcement.Channel.Announcements.Count;
      int cntTracker = announcement.Tracker.Announcements.Count;
      int cntRace = announcement.Race.Announcements.Count;

      _context.AddOrUpdate(announcement);

      SaveChanges();
      ResetContext();

      Tracker tracker = _context.GetTracker(
        _context.GetGame(announcement.Tracker.Game.Abbreviation)
        , _context.GetChannel(announcement.Tracker.Channel.Snowflake));

      Race race = _context.GetRace(announcement.Race.SrlId);

      Announcement? dbAnnouncement = _context.GetAnnouncement(race, tracker);

      Assert.IsNotNull(dbAnnouncement);
      Assert.AreEqual(cntChannel + 1, dbAnnouncement.Channel.Announcements.Count);
      Assert.AreEqual(cntRace + 1, race.Announcements.Count);
      Assert.AreEqual(cntTracker + 1, tracker.Announcements.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Increases_Collection_Count_Before_Save()
    {
      Announcement announcement = GenerateAnnouncement(RandomLocalActiveTracker, RandomLocalRace);

      int cntChannel = announcement.Channel.Announcements.Count;
      int cntTracker = announcement.Tracker.Announcements.Count;
      int cntRace = announcement.Race.Announcements.Count;

      _context.AddOrUpdate(announcement);

      Assert.AreEqual(cntChannel + 1, announcement.Channel.Announcements.Count);
      Assert.AreEqual(cntRace + 1, announcement.Race.Announcements.Count);
      Assert.AreEqual(cntTracker + 1, announcement.Tracker.Announcements.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Increases_Total_Count_After_Save()
    {
      int announcementCount = _context.Announcements.Local.Count;
      _context.AddOrUpdate(GenerateAnnouncement(RandomLocalTracker, RandomLocalRace));
      SaveChanges();

      Assert.AreEqual(announcementCount + 1, _context.Announcements.Local.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Increases_Total_Count_Before_Save()
    {
      int announcementCount = _context.Announcements.Local.Count;
      _context.AddOrUpdate(GenerateAnnouncement(RandomLocalTracker, RandomLocalRace));

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
