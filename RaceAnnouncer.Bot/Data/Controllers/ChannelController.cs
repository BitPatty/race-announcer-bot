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
    {
      destination.Snowflake = source.Snowflake;
      destination.DisplayName = source.DisplayName;
      destination.Guild = source.Guild;
    }

    public static Channel? GetChannel(
      this DatabaseContext context
      , ulong snowflake)
      => context
          .Channels
          .Local
          .SingleOrDefault(g => g.Snowflake.Equals(snowflake));
  }
}
