using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using RaceAnnouncer.Bot.Data.Controllers;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.Bot.Adapters
{
  public static class DatabaseAdapter
  {
    /// <summary>
    /// Checks whether an entity state is not <see cref="EntityState.Unchanged"/>
    /// </summary>
    /// <param name="entity">The entity</param>
    /// <returns>Returns true if the entity state is not unchanged</returns>
    public static bool HasEntityChanged(EntityEntry entity)
      => entity.State != EntityState.Unchanged;

    /// <summary>
    /// Migrates the specified <paramref name="context"/>
    /// </summary>
    /// <param name="context">The database context</param>
    public static void Migrate(DatabaseContext context)
      => context.Database.Migrate();

    /// <summary>
    /// Gets the list of races in the specified <paramref name="context"/>
    /// which don't have an unchanged state
    /// </summary>
    /// <param name="context">The database context</param>
    /// <returns>Returns the list of changed races</returns>
    public static List<Race> GetUpdatedRaces(DatabaseContext context)
    {
      context.ChangeTracker.DetectChanges();

      List<Race> races = new List<Race>();

      foreach (Race race in context.Races.Local)
      {
        if (HasEntityChanged(context.Entry(race)))
        {
          races.Add(race);
        }
        else if (context
          .GetEntrants(race)
          .Any(e => HasEntityChanged(context.Entry(e))))
        {
          races.Add(race);
        }
      }

      return races;
    }
  }
}
