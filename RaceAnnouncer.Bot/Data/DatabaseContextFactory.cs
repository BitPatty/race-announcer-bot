using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using RaceAnnouncer.Bot.Common;
using RaceAnnouncer.Schema;

namespace RaceAnnouncer.Bot.Data
{
  public class DatabaseContextFactory : IDesignTimeDbContextFactory<DatabaseContext>
  {
    public DatabaseContext CreateDbContext(string envPath)
    {
      DbContextOptionsBuilder<DatabaseContext> optionsBuilder
        = new DbContextOptionsBuilder<DatabaseContext>()
            .UseMySql(Credentials.ParseConnectionString(envPath));

      return new DatabaseContext(optionsBuilder.Options);
    }

    public DatabaseContext CreateDbContext(string[] args)
    {
      DbContextOptionsBuilder<DatabaseContext> optionsBuilder
        = new DbContextOptionsBuilder<DatabaseContext>()
            .UseMySql(Credentials.ParseConnectionString());

      return new DatabaseContext(optionsBuilder.Options);
    }

    public DatabaseContext CreateDbContext()
      => CreateDbContext(new string[] { });
  }
}
