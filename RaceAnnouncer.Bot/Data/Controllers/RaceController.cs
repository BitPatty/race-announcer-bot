using System.Collections.Generic;
using System.Linq;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.Bot.Data.Controllers
{
  public static class RaceController
  {
    public static Race? AddOrUpdate(this DatabaseContext context, Race race)
    {
      Race? r = context.GetRace(race.SrlId);

      if (r == null)
      {
        // Don't create new entries for finished races, we don't care about them
        if (
          race.State == SRLApiClient.Endpoints.RaceState.Over
          || race.State == SRLApiClient.Endpoints.RaceState.Unknown
        )
        {
          return null;
        }

        context.Races.Local.Add(race);
        return race;
      }
      else
      {
        r.AssignAttributes(race);
        return r;
      }
    }

    public static void AssignAttributes(this Race destination, Race source)
    {
      destination.SrlId = source.SrlId;
      destination.Game = source.Game;
      destination.Goal = source.Goal;
      destination.IsActive = source.IsActive;
      destination.Time = source.Time;
      destination.State = source.State;
      destination.ConsecutiveUpdateFailures = source.ConsecutiveUpdateFailures;
    }

    public static IEnumerable<Entrant> GetEntrants(
      this DatabaseContext context
      , Race race)
      => context
          .Entrants
          .Local
          .Where(e => e.Race.Equals(race));

    public static Race? GetRace(
      this DatabaseContext context
      , string srlId)
      => context
          .Races
          .Local
          .SingleOrDefault(res => res.SrlId.Equals(srlId, System.StringComparison.CurrentCultureIgnoreCase));
  }
}
