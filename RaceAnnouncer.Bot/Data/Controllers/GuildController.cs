using System.Linq;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.Bot.Data.Controllers
{
  public static class GuildController
  {
    public static Guild AddOrUpdate(this DatabaseContext context, Guild guild)
    {
      Guild? g = GetGuild(context, guild.Snowflake);

      if (g == null)
      {
        context.Guilds.Local.Add(guild);
        return guild;
      }
      else
      {
        AssignAttributes(g, guild);
        return g;
      }
    }

    public static void AssignAttributes(this Guild destination, Guild source)
    {
      destination.DisplayName = source.DisplayName;
      destination.Snowflake = source.Snowflake;
    }

    public static Guild? GetGuild(
      this DatabaseContext context
      , ulong snowflake)
      => context
          .Guilds
          .Local
          .FirstOrDefault(g => g.Snowflake.Equals(snowflake));
  }
}
