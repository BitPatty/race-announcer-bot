using System.Linq;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.Bot.Data.Controllers
{
  public static class ChannelController
  {
    public static Channel AddOrUpdate(this DatabaseContext context, Channel channel)
    {
      Channel? c = GetChannel(context, channel.Snowflake);

      if (c == null)
      {
        context.Channels.Local.Add(channel);
        return channel;
      }
      else
      {
        AssignAttributes(c, channel);
        return c;
      }
    }

    public static void AssignAttributes(this Channel destination, Channel source)
      => destination.DisplayName = source.DisplayName;

    public static Channel? GetChannel(
      this DatabaseContext context
      , long channelId)
      => context
          .Channels
          .Local
          .FirstOrDefault(c => c.Id.Equals(channelId));

    public static Channel? GetChannel(
      this DatabaseContext context
      , ulong snowflake)
      => context
          .Channels
          .Local
          .FirstOrDefault(g => g.Snowflake.Equals(snowflake));
  }
}
