using System;
using System.Collections.Generic;
using System.Linq;
using RaceAnnouncer.Bot.Data.Controllers;
using RaceAnnouncer.Bot.Data.Converters;
using RaceAnnouncer.Bot.Services;
using RaceAnnouncer.Common;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Schema.Models;
using SRLApiClient.Exceptions;
using SRLRace = SRLApiClient.Endpoints.Races.Race;

namespace RaceAnnouncer.Bot.Adapters
{
  public static class RaceAdapter
  {
    /// <summary>
    /// Synchronizes the races in the <paramref name="context"/> with the
    /// races from <paramref name="races"/>.
    /// </summary>
    /// <param name="context">The database context</param>
    /// <param name="srlService">The SRL service</param>
    /// <param name="races">The SRL races</param>
    public static void SyncRaces(
      DatabaseContext context
      , SRLService srlService
      , List<SRLRace> races)
    {
      List<Race> res = UpdateSRLRaces(context, races);
      UpdateDroppedRaces(context, srlService, res);
    }

    /// <summary>
    /// Updates the race entities base on the SRL race list
    /// </summary>
    /// <param name="context">The database context</param>
    /// <param name="races">The SRL race list</param>
    /// <returns>Returns the list of updated race entities</returns>
    private static List<Race> UpdateSRLRaces(
      DatabaseContext context
      , List<SRLRace> races)
    {
      List<Race> res = new List<Race>();

      foreach (SRLRace srlRace in races)
      {
        Race? race = SyncRace(context, srlRace);

        if (race != null)
          res.Add(race);
      }

      return res;
    }

    /// <summary>
    /// Syncs a srl race with it's persistent euivalent
    /// </summary>
    /// <param name="context">The database context</param>
    /// <param name="srlRace">The srl race</param>
    /// <returns>Returns the persisted race</returns>
    private static Race? SyncRace(
      DatabaseContext context
      , SRLRace srlRace
    )
    {
      Logger.Info($"({srlRace.Id}) Synchronizing...");

      Game g = SyncGame(context, srlRace);

      if (srlRace.State == SRLApiClient.Endpoints.RaceState.Over
        && context.GetRace(srlRace.Id) == null)
      {
        Logger.Info($"({srlRace.Id}) Race over and not persisted, continuing.");
        return null;
      }

      Race? race = srlRace.Convert(g);
      race = context.AddOrUpdate(race);

      if (race != null)
        SyncEntrants(context, srlRace, race);

      return race;
    }

    /// <summary>
    /// Updates the existing or adss a new game entity based on the
    /// <paramref name="srlRace"/>
    /// </summary>
    /// <param name="context">The database context</param>
    /// <param name="srlRace">The SRL race</param>
    /// <returns>The updated game entity</returns>
    private static Game SyncGame(
      DatabaseContext context
      , SRLRace srlRace)
    {
      Game game = srlRace.Game.Convert();
      return context.AddOrUpdate(game);
    }

    /// <summary>
    /// Updates existing, adds new and deletes removed entrants  from
    /// the <paramref name="race"/> entity
    /// </summary>
    /// <param name="context">The database context</param>
    /// <param name="srlRace">The SRL race</param>
    /// <param name="race">The race entity</param>
    private static void SyncEntrants
      (DatabaseContext context
      , SRLRace srlRace
      , Race race)
    {
      foreach (SRLApiClient.Endpoints.Races.Entrant entrant in srlRace.Entrants)
        context.AddOrUpdate(entrant.Convert(race));

      UpdateRemovedEntrants(context, srlRace, race);
    }

    /// <summary>
    /// Remove entrants from the <paramref name="race"/> entity which are
    /// no longer in the <paramref name="srlRace"/>.
    /// </summary>
    /// <param name="context">The database context</param>
    /// <param name="srlRace">The SRL race</param>
    /// <param name="race">The race entity</param>
    private static void UpdateRemovedEntrants(
      DatabaseContext context
      , SRLRace srlRace
      , Race race)
    {
      IEnumerable<Entrant> registeredEntrants = context.GetEntrants(race);

      foreach (Entrant e in registeredEntrants
        .Where(e => !srlRace.Entrants
          .Any(s => s.Name.Equals(e.DisplayName))))
      {
        context.DeleteEntrant(e);
      }
    }

    /// <summary>
    /// Attempts to fetch and update race details of race entities
    /// which are no longer in the SRL race list.
    /// </summary>
    /// <param name="context">The database context</param>
    /// <param name="srlService">The srl service</param>
    /// <param name="updatedRaces">The list of updated races</param>
    public static void UpdateDroppedRaces(
      DatabaseContext context
      , SRLService srlService
      , List<Race> updatedRaces)
    {
      List<Race> remainingActiveRaces = context
        .Races
        .Local
        .Where(r => r.IsActive && !updatedRaces.Any(ur => ur.SrlId.Equals(r.SrlId, StringComparison.CurrentCultureIgnoreCase)))
        .ToList();

      foreach (Race race in remainingActiveRaces)
      {
        try
        {
          Logger.Info($"({race.Id}) Dropped, Fetching race...");

          SRLRace srlRace
            = srlService.GetRaceAsync(race.SrlId).Result;

          Logger.Info($"({race.Id}) Race fetched, Synchronizing...");

          SyncRace(context, srlRace);
        }
        catch (Exception ex)
        {
          Logger.Error($"({race.SrlId}) Exception thrown", ex);

          // Avoid catching HttpExceptions
          if (
            ((ex is SRLParseException || ex.InnerException is SRLParseException)
            && race.State == SRLApiClient.Endpoints.RaceState.Over)
            || DateTime.UtcNow.Subtract(race.CreatedAt).TotalDays >= 7
          )
          {
            Logger.Info($"({race.SrlId}) Deactivating race...");

            race.IsActive = false;
            if (race.State < SRLApiClient.Endpoints.RaceState.Finished)
              race.State = SRLApiClient.Endpoints.RaceState.Unknown;
          }
        }
      }
    }
  }
}
