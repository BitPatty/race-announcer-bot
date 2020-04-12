using Microsoft.EntityFrameworkCore;
using RaceAnnouncer.Common;
using RaceAnnouncer.Schema;

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
