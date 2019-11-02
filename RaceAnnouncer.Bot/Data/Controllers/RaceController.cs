using System.Collections.Generic;
using System.Linq;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.Bot.Data.Controllers
{
  public static class RaceController
  {
    public static Race AddOrUpdate(this DatabaseContext context, Race race)
    {
      Race? r = context.Races.Local.FirstOrDefault(res => res.SrlId.Equals(race.SrlId));

      if (r == null)
      {
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
    }

    public static Game GetGame(
      this DatabaseContext context
      , Race race)
      => context
          .Races
          .Local
          .First(r => r.Equals(race))
          .Game;

    public static IEnumerable<Entrant> GetEntrants(
      this DatabaseContext context
      , Race race)
      => context
          .Entrants
          .Local
          .Where(e => e.Race.Equals(race));

    public static IEnumerable<Entrant> GetEntrantsOrdered(
      this DatabaseContext context
      , Race race)
      => context
          .Entrants
          .Local
          .Where(e => e.Race.Equals(race))
          .OrderBy(e => e.Place > 0 ? e.Place : 99)
          .ThenBy(e => e.State)
          .ThenBy(e => e.DisplayName);

    public static Race? GetRace(
      this DatabaseContext context
      , string srlId)
      => context
          .Races
          .Local
          .OrderByDescending(res => res.UpdatedAt)
          .FirstOrDefault(res => res.SrlId.Equals(srlId));
  }
}
