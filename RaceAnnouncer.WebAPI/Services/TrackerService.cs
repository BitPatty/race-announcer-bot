using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RaceAnnouncer.Common;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.WebAPI.Services
{
  public static class TrackerService
  {
    public static async Task<Tracker?> CreateTracker(long channelId, long gameId)
    {
      using DatabaseContext context = new ContextBuilder().CreateDbContext();

      Channel channel = await context
        .Channels
        .Where(c => c.Id.Equals(channelId) && c.IsActive)
        .SingleOrDefaultAsync()
        .ConfigureAwait(false);

      Game game = await context
        .Games
        .Where(c => c.Id.Equals(gameId))
        .SingleOrDefaultAsync()
        .ConfigureAwait(false);

      if (channel != null && game != null)
      {
        Tracker tracker = context
          .Trackers
          .Where(t => t.Game.Equals(game) && t.Channel.Equals(channel))
          .SingleOrDefault();

        if (tracker == null)
        {
          tracker = new Tracker(channel, game);
          context.Trackers.Add(tracker);
          await context.SaveChangesAsync().ConfigureAwait(false);
          await context.Entry(tracker).ReloadAsync().ConfigureAwait(false);
          return tracker;
        }
        else
        {
          throw new InvalidOperationException($"Duplicate entry for ({gameId}, {channelId})");
        }
      }
      else if (channel == null)
      {
        throw new ArgumentException($"Invalid channelId: {channelId}");
      }
      else
      {
        throw new ArgumentException($"Invalid gameId: {gameId}");
      }
    }
  }
}
