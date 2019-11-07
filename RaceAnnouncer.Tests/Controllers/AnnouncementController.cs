using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using RaceAnnouncer.Tests.TestHelpers;
using RaceAnnouncer.Schema.Models;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Bot.Data.Controllers;
using System;

#pragma warning disable CS8602 // Dereference of a possibly null reference.
#pragma warning disable CS8604 // Possible null reference argument.

namespace RaceAnnouncer.Tests.Controllers
{
  public class AnnouncementController
  {
    private DatabaseContext _context = ContextHelper.GetContext();

    [SetUp]
    public void Setup()
    {
      ResetContext();
      ResetDatabase();
      ResetContext();

      _context.AddOrUpdate(new Guild(1, "Guild 1"));
      _context.AddOrUpdate(new Guild(2, "Guild 2"));
      _context.AddOrUpdate(new Guild(3, "Guild 3"));
      _context.AddOrUpdate(new Guild(4, "Guild 4"));

      _context.Channels.Add(new Channel(_context.GetGuild(1), 1, "Channel 1"));
      _context.Channels.Add(new Channel(_context.GetGuild(1), 2, "Channel 2"));
      _context.Channels.Add(new Channel(_context.GetGuild(2), 3, "Channel 3"));
      _context.Channels.Add(new Channel(_context.GetGuild(3), 4, "Channel 4"));

      _context.Games.Add(new Game("g1", "Game 1", 1));
      _context.Games.Add(new Game("g2", "Game 2", 2));
      _context.Games.Add(new Game("g3", "Game 3", 3));
      _context.Games.Add(new Game("g4", "Game 4", 4));

      _context.Races.Add(new Race(_context.GetGame("g1"), "Goal 1", "r1", 1, true, SRLApiClient.Endpoints.RaceState.EntryOpen));
      _context.Races.Add(new Race(_context.GetGame("g1"), "Goal 2", "r2", 2, true, SRLApiClient.Endpoints.RaceState.EntryClosed));
      _context.Races.Add(new Race(_context.GetGame("g2"), "Goal 3", "r3", 3, true, SRLApiClient.Endpoints.RaceState.Over));
      _context.Races.Add(new Race(_context.GetGame("g3"), "Goal 4", "r4", 4, true, SRLApiClient.Endpoints.RaceState.Finished));

      _context.Trackers.Add(new Tracker(_context.GetChannel(1), _context.GetGame("g1")));
      _context.Trackers.Add(new Tracker(_context.GetChannel(1), _context.GetGame("g2")));
      _context.Trackers.Add(new Tracker(_context.GetChannel(2), _context.GetGame("g3")));

      _context.SaveChanges();

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

      Assert.AreEqual(0, _context.Guilds.Count());
    }

    [Test]
    public void AddOrUpdate_Add_One()
    {
      Assert.AreEqual(0, _context.Announcements.Local.Count);

      Announcement announcement =
        new Announcement(
          _context.GetChannel(2)
          , _context.GetTracker(
            _context.GetGame("g1")
            , _context.GetChannel(1))
          , _context.GetRace("r1")
          , 1);

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(announcement);
      });

      Assert.AreEqual(1, _context.Announcements.Local.Count);

      Assert.DoesNotThrow(delegate
      {
        _context
        .Announcements
        .Local
        .First()
        .MessageCreatedAt = DateTime.UtcNow;
      });

      Assert.DoesNotThrow(delegate
      {
        _context
        .Announcements
        .Local
        .First()
        .MessageUpdatedAt = DateTime.UtcNow;
      });

      Assert.AreEqual(EntityState.Added, _context.Entry(announcement).State);

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      ResetContext();

      Assert.AreEqual(1, _context.Announcements.Local.Count);

      Assert.AreEqual(
        announcement.Channel.Snowflake
        , _context.Announcements.Local.First().Channel.Snowflake);

      Assert.AreEqual(announcement.Race.SrlId
        , _context.Announcements.Local.First().Race.SrlId);

      Assert.AreEqual(announcement.Tracker.Id
        , _context.Announcements.Local.First().Tracker.Id);

      Assert.AreEqual(announcement.Snowflake
        , _context.Announcements.Local.First().Snowflake);
    }

    [Test]
    public void AddOrUpdate_Add_Two()
    {
      Assert.AreEqual(0, _context.Announcements.Local.Count);

      Announcement announcement1 =
        new Announcement(
          _context.GetChannel(2)
          , _context.GetTracker(
            _context.GetGame("g1")
            , _context.GetChannel(1))
          , _context.GetRace("r1")
          , 1);

      Announcement announcement2 =
        new Announcement(
          _context.GetChannel(3)
          , _context.GetTracker(
            _context.GetGame("g1")
            , _context.GetChannel(1))
          , _context.GetRace("r2"), 2);

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(announcement1);
      });

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(announcement2);
      });

      Assert.AreEqual(2, _context.Announcements.Local.Count);

      Assert.AreEqual(EntityState.Added, _context.Entry(announcement1).State);
      Assert.AreEqual(EntityState.Added, _context.Entry(announcement2).State);

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      ResetContext();

      Assert.AreEqual(2, _context.Announcements.Local.Count);
    }

    [Test]
    public void AddOrUpdate_Add_Duplicate()
    {
      Assert.AreEqual(0, _context.Announcements.Local.Count);

      Announcement announcement1 =
        new Announcement(
        _context.GetChannel(2)
        , _context.GetTracker(
          _context.GetGame("g1")
          , _context.GetChannel(1))
        , _context.GetRace("r1"), 1);

      Announcement announcement2
        = new Announcement(
        _context.GetChannel(3)
        , _context.GetTracker(
          _context.GetGame("g1")
          , _context.GetChannel(1))
        , _context.GetRace("r1"), 1);

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(announcement1);
      });

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(announcement2);
      });

      Assert.AreEqual(1, _context.Announcements.Local.Count);

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      ResetContext();

      Assert.AreEqual(1, _context.Announcements.Local.Count);
    }

    [Test]
    public void GetAnnouncement()
    {
      Assert.AreEqual(0, _context.Announcements.Local.Count);

      Announcement announcement =
        new Announcement(
          _context.GetChannel(2)
          , _context.GetTracker(_context.GetGame("g1")
          , _context.GetChannel(1))
          , _context.GetRace("r1"), 1);

      Assert.IsNull(_context.GetAnnouncement(
        _context.GetRace("r1")
        , _context.GetTracker(
          _context.GetGame("g1")
          , _context.GetChannel(1))));

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(announcement);
      });

      Assert.IsNotNull(
        _context.GetAnnouncement(
          _context.GetRace("r1")
          , _context.GetTracker(
            _context.GetGame("g1")
            , _context.GetChannel(1))));
    }

    [Test]
    public void AssignAttributes()
    {
      Announcement announcement1 =
        new Announcement(
          _context.GetChannel(1)
          , _context.GetTracker(
            _context.GetGame("g1")
            , _context.GetChannel(1))
          , _context.GetRace("r1")
          , 1);

      Announcement announcement2 =
        new Announcement(
          _context.GetChannel(2)
          , _context.GetTracker(
            _context.GetGame("g3")
            , _context.GetChannel(2))
          , _context.GetRace("r2")
          , 1);

      Assert.DoesNotThrow(delegate
      {
        announcement1.AssignAttributes(announcement2);
      });

      Assert.AreSame(announcement1.Channel
        , announcement2.Channel);

      Assert.AreSame(announcement1.Tracker
        , announcement2.Tracker);

      Assert.AreSame(announcement1.Race
        , announcement2.Race);

      Assert.AreEqual(announcement1.MessageCreatedAt
        , announcement2.MessageCreatedAt);

      Assert.AreEqual(announcement1.MessageUpdatedAt
        , announcement2.MessageUpdatedAt);

      Assert.AreEqual(announcement1.Snowflake
        , announcement2.Snowflake);
    }
  }
}
