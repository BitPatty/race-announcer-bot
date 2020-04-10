using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using RaceAnnouncer.Schema;

namespace RaceAnnouncer.Common
{
  public class ContextBuilder : IDesignTimeDbContextFactory<DatabaseContext>
  {
    public DatabaseContext CreateDbContext(string? envPath = null)
    {
      DbContextOptionsBuilder<DatabaseContext> optionsBuilder
        = new DbContextOptionsBuilder<DatabaseContext>()
            .UseMySql(Credentials.BuildConnectionString(envPath));

      return new DatabaseContext(optionsBuilder.Options);
    }

    public DatabaseContext CreateDbContext(string[] args) => CreateDbContext();
  }
}
