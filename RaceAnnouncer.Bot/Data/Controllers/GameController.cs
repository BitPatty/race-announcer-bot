using System.Linq;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.Bot.Data.Controllers
{
  public static class GameController
  {
    public static Game AddOrUpdate(this DatabaseContext context, Game game)
    {
      Game? g = context.GetGame(game.Abbreviation);

      if (g == null)
      {
        context.Games.Local.Add(game);
        return game;
      }
      else
      {
        g.AssignAttributes(game);
        return g;
      }
    }

    public static void AssignAttributes(this Game destination, Game source)
    {
      destination.Abbreviation = source.Abbreviation;
      destination.Name = source.Name;
      destination.SrlId = source.SrlId;
    }

    public static Game? GetGame(
      this DatabaseContext context
      , string abbreviation)
      => context
          .Games
          .Local
          .SingleOrDefault(g => g.Abbreviation.Equals(abbreviation, System.StringComparison.CurrentCultureIgnoreCase));
  }
}
