using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using RaceAnnouncer.Bot.Data;
using RaceAnnouncer.Common;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.Tests.TestHelpers
{
  public static class ContextHelper
  {

    public static DatabaseContext GetContext()
      => new ContextBuilder().CreateDbContext(TestFiles.EnvFile);

    public static void ResetDatabase(DatabaseContext context)
    {
      context.Database.EnsureDeleted();
      context.Database.Migrate();
    }

    public static void ResetContext(ref DatabaseContext context)
    {
      context?.Dispose();
      context = GetContext();
    }


  }
}
