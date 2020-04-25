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
        Logger.Info($"({srlRace.Id}) Synchronizing...");

        Game g = SyncGame(context, srlRace);
        Race? r = SyncRace(context, srlRace, g);

        if (r != null)
        {
          SyncEntrants(context, srlRace, r);
          res.Add(r);
        }
      }

      return res;
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
    /// Updates the existing or adds a new race entity based on the
    /// <paramref name="srlRace"/>
    /// </summary>
    /// <param name="context">The database context</param>
    /// <param name="srlRace">The SRL race</param>
    /// <param name="game">The game entity</param>
    /// <returns>The updated race entity</returns>
    private static Race? SyncRace(DatabaseContext context
      , SRLRace srlRace
      , Game game)
    {
      if (srlRace.State >= SRLApiClient.Endpoints.RaceState.Finished
        && context.GetRace(srlRace.Id) == null)
      {
        return null;
      }

      Race race = srlRace.Convert(game);
      return context.AddOrUpdate(race);
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
      IEnumerable<Race> remainingActiveRaces = context
        .Races
        .Local
        .Where(r => r.IsActive && !updatedRaces.Contains(r));

      foreach (Race race in remainingActiveRaces)
      {
        try
        {
          Logger.Info($"({race.Id}) Dropped, Fetching race...");

          SRLRace srlRace
            = srlService.GetRaceAsync(race.SrlId).Result;

          Logger.Info($"({race.Id}) Race fetched, Synchronizing...");

          Schema.Models.Game game
            = context.AddOrUpdate(srlRace.Game.Convert());

          race.AssignAttributes(srlRace.Convert(game));

          race.IsActive =
            srlRace.State != SRLApiClient.Endpoints.RaceState.Over
            && srlRace.State != SRLApiClient.Endpoints.RaceState.Unknown;

          foreach (SRLApiClient.Endpoints.Races.Entrant entrant in srlRace.Entrants)
            context.AddOrUpdate(entrant.Convert(race));
        }
        catch (Exception ex)
        {
          Logger.Error($"({race.SrlId}) Exception thrown", ex);

          // Avoid catching HttpExceptions
          if (
            ex is SRLParseException
            || ex.InnerException is SRLParseException
            || race.State >= SRLApiClient.Endpoints.RaceState.Finished
            || DateTime.UtcNow.Subtract(race.CreatedAt).TotalHours >= 12
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
