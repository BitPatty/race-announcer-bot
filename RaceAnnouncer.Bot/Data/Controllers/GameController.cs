using System.Linq;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.Bot.Data.Controllers
{
  public static class GameController
  {
    public static Game AddOrUpdate(this DatabaseContext context, Game game)
    {
      Game? gameByAbbreviation = context.GetGame(game.Abbreviation);
      Game? gameById = context.GetGame(game.SrlId);

      if (
        (gameByAbbreviation != null || gameById != null)
        && gameByAbbreviation?.Equals(gameById) == false
      )
      {
        throw new System.Exception($"SRL id and abbreviation mismatch for game: {game.Id}/{game.SrlId}");
      }

      if (gameByAbbreviation == null)
      {
        context.Games.Local.Add(game);
        return game;
      }
      else
      {
        gameByAbbreviation.AssignAttributes(game);
        return gameByAbbreviation;
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

    private static Game? GetGame(
      this DatabaseContext context
      , int srlId)
      => context
          .Games
          .Local
          .SingleOrDefault(g => g.SrlId.Equals(srlId));
  }
}
