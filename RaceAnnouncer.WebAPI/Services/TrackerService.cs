using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RaceAnnouncer.Common;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.WebAPI.Services
{
  public class TrackerService
  {
    public static async Task<Tracker> CreateTracker(long channelId, long gameId)
    {
      using DatabaseContext context = new ContextBuilder().CreateDbContext();

      Channel channel = await context
        .Channels
        .Where(c => c.Id.Equals(channelId) && c.IsActive)
        .SingleOrDefaultAsync();


      Game game = await context
        .Games
        .Where(c => c.Id.Equals(gameId))
        .SingleOrDefaultAsync();

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
      }

      return null;
    }
  }
}
