using System.Collections.Generic;
using System.Linq;
using Discord.WebSocket;
using RaceAnnouncer.Bot.Data.Controllers;
using RaceAnnouncer.Bot.Services;
using RaceAnnouncer.Common;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.Bot.Adapters
{
  public static class ChannelAdapter
  {
    /// <summary>
    /// Creates/updates and activates a channel
    /// </summary>
    /// <param name="context">The database context</param>
    /// <param name="channel">The channel</param>
    /// <returns>Returns the updated guild</returns>
    public static Channel EnableChannel(
      DatabaseContext context
      , SocketTextChannel channel)
     => context.AddOrUpdate(
        new Channel(
          EnableGuild(context, channel.Guild)
          , channel.Id
          , channel.Name)
        { IsActive = true });

    /// <summary>
    /// Creates/updates and activates a guild
    /// </summary>
    /// <param name="context">The database context</param>
    /// <param name="guild">The guild</param>
    /// <returns>Returns the updated guild</returns>
    public static Guild EnableGuild(
      DatabaseContext context
      , SocketGuild guild)
      => context.AddOrUpdate(
         new Guild(
           guild.Id
           , guild.Name)
         { IsActive = true });

    /// <summary>
    /// Synchronizes the channels/guilds in the <paramref name="context"/>
    /// with the channels/guilds from the <paramref name="discordService"/>
    /// </summary>
    /// <param name="context">The database context</param>
    /// <param name="discordService">The discord service</param>
    public static void SyncAll(
      DatabaseContext context
      , DiscordService discordService)
    {
      SyncGuilds(context, discordService);
      SyncChannels(context, discordService);
    }

    /// <summary>
    /// Synchronizes the channels in the <paramref name="context"/> with the
    /// channels from the <paramref name="discordService"/>
    /// </summary>
    /// <param name="context">The database context</param>
    /// <param name="discordService">The discord service</param>
    public static void SyncChannels(
      DatabaseContext context
      , DiscordService discordService)
    {
      IEnumerable<SocketTextChannel> textChannels
        = discordService.GetTextChannels();

      EnableChannels(context, textChannels);
      DisableDroppedChannels(context, textChannels);
    }

    /// <summary>
    /// Synchronizes the guilds in the <paramref name="context"/> with the
    /// guilds from the <paramref name="discordService"/>
    /// </summary>
    /// <param name="context">The database context</param>
    /// <param name="discordService">The discord service</param>
    public static void SyncGuilds(
      DatabaseContext context
      , DiscordService discordService)
    {
      IEnumerable<SocketGuild> guilds
        = discordService.GetGuilds();

      EnableGuilds(context, guilds);
      DisableDroppedGuilds(context, guilds);
    }

    /// <summary>
    /// Disables channel and tracker entities associated
    /// with dropped channels
    /// </summary>
    /// <param name="context">The database context</param>
    /// <param name="textChannels">The available channels</param>
    private static void DisableDroppedChannels(
      DatabaseContext context
      , IEnumerable<SocketTextChannel> textChannels)
    {
      foreach (Channel c in context.Channels.Local)
      {
        if (!textChannels.Any(tc => tc.Id.Equals(c.Snowflake)))
        {
          Logger.Info($"Disabling channel {c.Id} (Dropped)");

          c.IsActive = false;
          context.DisableTrackersByChannel(c);
        }
      }
    }

    /// <summary>
    /// Disables tracker and channel entities associated
    /// with dropped guilds
    /// </summary>
    /// <param name="context">The database context</param>
    /// <param name="guilds">The available guilds</param>
    private static void DisableDroppedGuilds(
      DatabaseContext context
      , IEnumerable<SocketGuild> guilds)
    {
      foreach (Guild guild in context.Guilds.Local.Where(g => g.IsActive))
      {
        if (!guilds.Any(sg => sg.Id.Equals(guild.Snowflake)))
        {
          Logger.Info($"Disabling guild {guild.Id} (Dropped)");

          context.DisableTrackersByGuild(guild);
          context.DisableChannelsByGuild(guild);
          guild.IsActive = false;
        }
      }
    }

    /// <summary>
    /// Creates/Updates channel entities based on the channel
    /// list <paramref name="textChannels"/>
    /// </summary>
    /// <param name="context">The database context</param>
    /// <param name="textChannels">The available channels</param>
    private static void EnableChannels(
      DatabaseContext context
      , IEnumerable<SocketTextChannel> textChannels)
    {
      foreach (SocketTextChannel stc in textChannels)
        EnableChannel(context, stc);
    }

    /// <summary>
    /// Creates/Updates guild entities based on the guild
    /// list <paramref name="textChannels"/>
    /// </summary>
    /// <param name="context">The database context</param>
    /// <param name="guilds">The available guilds</param>
    private static void EnableGuilds(
      DatabaseContext context
      , IEnumerable<SocketGuild> guilds)
    {
      foreach (SocketGuild sg in guilds)
        EnableGuild(context, sg);
    }
  }
}
