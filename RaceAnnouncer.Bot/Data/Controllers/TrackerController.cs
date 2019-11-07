using System.Collections.Generic;
using System.Linq;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Schema.Models;
using RaceAnnouncer.Schema.Models.Enumerations;

namespace RaceAnnouncer.Bot.Data.Controllers
{
  public static class TrackerController
  {
    public static Tracker AddOrUpdate(this DatabaseContext context, Tracker tracker)
    {
      Tracker? t = context.GetTracker(tracker.Game, tracker.Channel);

      if (t == null)
      {
        context.Trackers.Local.Add(tracker);
        return tracker;
      }
      else
      {
        t.AssignAttributes(tracker);
        return t;
      }
    }

    public static IEnumerable<Tracker> GetActiveTrackers(this DatabaseContext context)
      => context
          .Trackers
          .Local
          .Where(t => t.State.Equals(TrackerState.Active));

    public static IEnumerable<Tracker> GetActiveTrackers(this DatabaseContext context, Game game)
      => context
          .Trackers
          .Local
          .Where(t => t.Game.Equals(game) && t.State.Equals(TrackerState.Active));

    public static Tracker? GetTracker(this DatabaseContext context, Game game, Channel channel)
      => context
          .Trackers
          .Local
          .FirstOrDefault(t
            => t.Channel.Equals(channel)
            && t.Game.Equals(game)
            && t.State != TrackerState.Dead
            && t.State != TrackerState.Unknown);

    public static void DisableTrackersByChannel(this DatabaseContext context, ulong snowflake)
      => context
          .Trackers
          .Local
          .Where(t => t.Channel.Snowflake.Equals(snowflake))
          .ToList()
          .ForEach(t => t.State = TrackerState.Dead);

    public static void DisableTrackersByChannel(this DatabaseContext context, Channel channel)
      => context
          .Trackers
          .Local
          .Where(t => t.Channel.Equals(channel))
          .ToList()
          .ForEach(t => t.State = TrackerState.Dead);

    public static void DisableTrackersByGuild(this DatabaseContext context, ulong snowflake)
      => context
          .Trackers
          .Local
          .Where(t => t.Channel.Guild.Snowflake.Equals(snowflake))
          .ToList()
          .ForEach(t => t.State = TrackerState.Dead);

    public static void AssignAttributes(this Tracker destination, Tracker source)
    {
      destination.Channel = source.Channel;
      destination.Game = source.Game;
    }
  }
}
