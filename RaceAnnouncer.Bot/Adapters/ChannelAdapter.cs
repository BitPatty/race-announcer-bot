using System.Collections.Generic;
using System.Linq;
using Discord.WebSocket;
using RaceAnnouncer.Bot.Data.Controllers;
using RaceAnnouncer.Bot.Data.Converters;
using RaceAnnouncer.Bot.Services;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.Bot.Adapters
{
  public static class ChannelAdapter
  {
    /// <summary>
    /// Synchronizes the channels in the <paramref name="context"/> with the
    /// channels from the <paramref name="discordService"/>
    /// </summary>
    /// <param name="context"></param>
    /// <param name="discordService"></param>
    public static void SyncChannels(
      DatabaseContext context
      , DiscordService discordService)
    {
      IEnumerable<SocketTextChannel> textChannels
        = discordService.GetTextChannels();

      UpdateDiscordChannels(context, textChannels);
      UpdateDroppedChannels(context, textChannels);
    }

    /// <summary>
    /// Disables trackers associated with dropped channels
    /// </summary>
    /// <param name="context">The database context</param>
    /// <param name="textChannels">The available channels</param>
    private static void UpdateDroppedChannels(
      DatabaseContext context,
      IEnumerable<SocketTextChannel> textChannels
      )
    {
      foreach (Channel c in context.Channels.Local)
      {
        if (!textChannels.Any(tc => tc.Id.Equals(c.Snowflake)))
          context.DisableTrackersByChannel(c);
      }
    }

    /// <summary>
    /// Creates/Updates channel entities based on the channel
    /// list <paramref name="textChannels"/>
    /// </summary>
    /// <param name="context">The database context</param>
    /// <param name="textChannels">The available channels</param>
    private static void UpdateDiscordChannels(
      DatabaseContext context
      , IEnumerable<SocketTextChannel> textChannels)
    {
      foreach (SocketTextChannel stc in textChannels)
      {
        Guild g = context.AddOrUpdate(stc.Guild.Convert());
        context.AddOrUpdate(stc.Convert(g));
      }
    }
  }
}
