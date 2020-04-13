using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RaceAnnouncer.Common;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.WebAPI.Services
{
  /// <summary>
  /// Handles interactions with the tracker entities
  /// </summary>
  public static class TrackerService
  {
    /// <summary>
    /// Create a new tracker
    /// </summary>
    /// <param name="channelId">The channel id</param>
    /// <param name="gameId">The game id</param>
    /// <returns>Returns the created tracker</returns>
    public static async Task<Tracker> CreateTracker(long channelId, long gameId)
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

    /// <summary>
    /// Updates a single tracker
    /// </summary>
    /// <param name="trackerId">The tracker id</param>
    /// <param name="gameId">The (new) game id</param>
    /// <param name="channelId">The (new) channel id</param>
    /// <returns>Returns the updated tracker</returns>
    public static async Task<Tracker> UpdateTracker(long trackerId, long gameId, long channelId)
    {
      using DatabaseContext context = new ContextBuilder().CreateDbContext();

      Tracker tracker = await context
        .Trackers
        .Where(t => t.Id.Equals(trackerId))
        .Include(c => c.Channel)
        .SingleOrDefaultAsync()
        .ConfigureAwait(false);

      if (tracker == null)
        throw new ArgumentException("Invalid trackerId");

      Channel channel = await context
        .Channels
        .Where(c => c.Id.Equals(channelId) && c.IsActive)
        .SingleOrDefaultAsync()
        .ConfigureAwait(false);

      if (channel == null)
        throw new ArgumentException("Invalid channelId");

      if (channel.GuildId != tracker.Channel.GuildId)
        throw new InvalidOperationException($"Cannot move tracker to a different guild ({tracker.Channel.GuildId} => {channel.GuildId})");

      Game game = await context
        .Games
        .Where(c => c.Id.Equals(gameId))
        .SingleOrDefaultAsync()
        .ConfigureAwait(false);

#pragma warning disable IDE0016 // Use 'throw' expression
      if (game == null)
        throw new ArgumentException("Invalid gameId");
#pragma warning restore IDE0016 // Use 'throw' expression

      tracker.Channel = channel;
      tracker.Game = game;

      await context.SaveChangesAsync().ConfigureAwait(false);

      return await context
        .Trackers
        .Where(t => t.Id.Equals(trackerId))
        .Include(c => c.Channel)
        .SingleOrDefaultAsync()
        .ConfigureAwait(false);
    }
  }
}
