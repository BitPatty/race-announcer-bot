using System;
using System.Collections.Generic;
using System.Linq;
using RaceAnnouncer.Bot.Common;
using RaceAnnouncer.Bot.Data.Controllers;
using RaceAnnouncer.Bot.Data.Converters;
using RaceAnnouncer.Bot.Services;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Schema.Models;

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
      , IEnumerable<SRLApiClient.Endpoints.Races.Race> races)
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
      , IEnumerable<SRLApiClient.Endpoints.Races.Race> races)
    {
      List<Race> res = new List<Race>();

      foreach (SRLApiClient.Endpoints.Races.Race srlRace in races)
      {
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
      , SRLApiClient.Endpoints.Races.Race srlRace)
    {
      Logger.Info($"({srlRace.Id}) Updating game");
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
      , SRLApiClient.Endpoints.Races.Race srlRace
      , Game game)
    {
      Logger.Info($"({srlRace.Id}) Updating race");
      
      if(srlRace.State >= SRLApiClient.Endpoints.RaceState.Finished
        && context.GetRace(srlRace.Id) == null) return null;

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
      , SRLApiClient.Endpoints.Races.Race srlRace
      , Race race)
    {
      Logger.Info($"({srlRace.Id}) Updating entrants");
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
      , SRLApiClient.Endpoints.Races.Race srlRace
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
    /// <param name="srlRaces">The list of received SRL races</param>
    public static void UpdateDroppedRaces(
      DatabaseContext context
      , SRLService srlService
      , IEnumerable<Race> srlRaces)
    {
      foreach (Race race in context
        .Races
        .Local
        .Where(r => r.IsActive && !srlRaces.Contains(r)))
      {
        try
        {
          SRLApiClient.Endpoints.Races.Race srlRace
            = srlService.GetRaceAsync(race.SrlId).Result;

          Schema.Models.Game game
            = context.AddOrUpdate(srlRace.Game.Convert());

          race.AssignAttributes(srlRace.Convert(game));

          //Since SRL doesn't implement the
          //pagination of active races properly
          //we just ignore finished races for now
          race.IsActive = srlRace.State
            < SRLApiClient.Endpoints.RaceState.Finished;

          foreach (SRLApiClient.Endpoints.Races.Entrant entrant in srlRace.Entrants)
            context.AddOrUpdate(entrant.Convert(race));
        }
        catch (Exception ex)
        {
          Logger.Error($"({race.SrlId}) Exception thrown: {ex.Message}");
          Logger.Error($"({race.SrlId}) Inner exception: {ex.InnerException?.Message}");
          Logger.Error($"({race.SrlId}) Stack trace: {ex.StackTrace}");

          race.IsActive = false;
          if (race.State != SRLApiClient.Endpoints.RaceState.Finished)
            race.State = SRLApiClient.Endpoints.RaceState.Unknown;
        }
      }
    }
  }
}
