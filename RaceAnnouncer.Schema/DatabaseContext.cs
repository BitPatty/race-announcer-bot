using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Console;
using RaceAnnouncer.Schema.Models;
using RaceAnnouncer.Schema.Models.Configurations;

#pragma warning disable CS8618 // Non-nullable field is uninitialized. Consider declaring as nullable.

namespace RaceAnnouncer.Schema
{
  public class DatabaseContext : DbContext
  {
    public DatabaseContext(DbContextOptions<DatabaseContext> options) : base(options) { }

    public static readonly Microsoft.Extensions.Logging.LoggerFactory _myLoggerFactory = new LoggerFactory(new[] { new Microsoft.Extensions.Logging.Debug.DebugLoggerProvider() });

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
      optionsBuilder.UseLoggerFactory(_myLoggerFactory);
    }

    public void LoadRemote()
    {
      ChangeTracker.AutoDetectChangesEnabled = false;

      Guilds.Load();
      Channels.Load();
      Games.Load();
      Trackers.Load();
      Races.Load();
      Entrants.Load();
      Announcements.Load();
    }

    public override int SaveChanges()
    {
      ChangeTracker.DetectChanges();
      return base.SaveChanges();
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
      base.OnModelCreating(builder);
      builder.ApplyConfiguration(new ChannelConfiguration())
        .ApplyConfiguration(new GuildConfiguration())
        .ApplyConfiguration(new GameConfiguration())
        .ApplyConfiguration(new TrackerConfiguration())
        .ApplyConfiguration(new RaceConfiguration())
        .ApplyConfiguration(new EntrantConfiguration())
        .ApplyConfiguration(new AnnouncementConfiguration())
        .HasChangeTrackingStrategy(ChangeTrackingStrategy.Snapshot);
    }

    public DbSet<Guild> Guilds { get; set; }
    public DbSet<Channel> Channels { get; set; }
    public DbSet<Game> Games { get; set; }
    public DbSet<Tracker> Trackers { get; set; }
    public DbSet<Race> Races { get; set; }
    public DbSet<Entrant> Entrants { get; set; }
    public DbSet<Announcement> Announcements { get; set; }
  }
}
