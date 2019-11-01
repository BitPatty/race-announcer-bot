using System.Linq;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.Bot.Data.Controllers
{
  public static class EntrantController
  {
    public static Entrant AddOrUpdate(this DatabaseContext context, Entrant entrant)
    {
      Entrant? e = context.GetEntrant(entrant.Race, entrant.DisplayName);

      if (e == null)
      {
        context.Entrants.Local.Add(entrant);
        return entrant;
      }
      else
      {
        e.AssignAttributes(entrant);
        return e;
      }
    }

    public static void AssignAttributes(this Entrant destination, Entrant source)
    {
      destination.Time = source.Time;
      destination.State = source.State;
      destination.Place = source.Place;
      destination.Race = source.Race;
    }

    public static void DeleteEntrant(
      this DatabaseContext context
      , Entrant entrant)
      => context
          .Entrants
          .Local
          .Remove(entrant);

    public static Entrant? GetEntrant(
      this DatabaseContext context
      , Race race
      , string name)
      => context
          .Entrants
          .Local
          .FirstOrDefault(e => e.Race.Equals(race) && e.DisplayName.Equals(name));
  }
}
