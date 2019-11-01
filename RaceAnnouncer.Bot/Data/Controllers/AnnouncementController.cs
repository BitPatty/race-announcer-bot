using System.Collections.Generic;
using System.Linq;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.Bot.Data.Controllers
{
  public static class AnnouncementController
  {
    public static Announcement AddOrUpdate(this DatabaseContext context, Announcement announcement)
    {
      Announcement? a = context.GetAnnouncement(announcement.Race, announcement.Tracker);

      if (a == null)
      {
        context.Announcements.Local.Add(announcement);
        return announcement;
      }
      else
      {
        a.AssignAttributes(announcement);
        return a;
      }
    }

    public static void AssignAttributes(this Announcement destination, Announcement source)
    {
      destination.Channel = source.Channel;
      destination.MessageCreatedAt = source.MessageCreatedAt;
      destination.MessageUpdatedAt = source.MessageUpdatedAt;
      destination.Race = source.Race;
      destination.Snowflake = source.Snowflake;
      destination.Tracker = source.Tracker;
    }

    public static Announcement? GetAnnouncement(
      this DatabaseContext context
      , Race race
      , Tracker tracker)
      => context
          .Announcements
          .Local
          .FirstOrDefault(a
            => a.Tracker.Equals(tracker)
            && a.Race.Equals(race));

    public static Channel GetChannel(
      this DatabaseContext context
      , Announcement announcement)
      => context
          .Announcements
          .Local
          .First(a => a.Equals(announcement))
          .Channel;

    public static Race GetRace(
      this DatabaseContext context
      , Announcement announcement)
      => context
          .Announcements
          .Local
          .First(a => a.Equals(announcement))
          .Race;

    public static IEnumerable<Announcement> GetAnnouncements(
      this DatabaseContext context
      , List<Race> races)
      => context
          .Announcements
          .Local
          .Where(a => races.Contains(a.Race));
  }
}
