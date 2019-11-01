using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.EntityFrameworkCore;
using RaceAnnouncer.Bot.Data;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Bot.Common;
using System.IO;

namespace RaceAnnouncer.Tests.Helpers
{
  public static class ContextHelper
  {
    public static DatabaseContext GetContext()
      => new DatabaseContextFactory().CreateDbContext(Path.Combine(Directory.GetCurrentDirectory(), ".env.test"));

    public static void ResetDatabase(DatabaseContext context)
    {
      context.Database.EnsureDeleted();
      context.Database.Migrate();
    }

    public static void ResetContext(ref DatabaseContext context)
    {
      context.Dispose();
      context = GetContext();
    }
  }
}
