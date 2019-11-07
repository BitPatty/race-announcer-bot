using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using RaceAnnouncer.Tests.TestHelpers;
using RaceAnnouncer.Schema.Models;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Bot.Data.Controllers;

namespace RaceAnnouncer.Tests.Controllers
{
  public class GuildController
  {
    private DatabaseContext _context = ContextHelper.GetContext();

    [SetUp]
    public void Setup()
    {
      ResetContext();
      ResetDatabase();
      ResetContext();
    }

    public void ResetContext()
    {
      Assert.DoesNotThrow(delegate
      {
        ContextHelper.ResetContext(ref _context);
      });

      Assert.DoesNotThrow(delegate
      {
        _context.LoadRemote();
      });
    }

    public void ResetDatabase()
    {
      Assert.DoesNotThrow(delegate
      {
        ContextHelper.ResetDatabase(_context);
      });

      Assert.AreEqual(0
        , _context.Guilds.Count());
    }

    [Test]
    public void AddOrUpdate_Add_One()
    {
      Guild guild = new Guild(1, "foo");

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(guild);
      });

      Assert.AreEqual(1
        , _context.Guilds.Local.Count);

      Assert.AreSame(guild
        , _context.Guilds.Local.First());

      Assert.AreEqual(EntityState.Added
        , _context.Entry(guild).State);

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      ResetContext();

      Assert.AreEqual(1
        , _context.Guilds.Local.Count);

      Assert.AreNotSame(guild
        , _context.Guilds.Local.First());

      Assert.AreEqual(guild.DisplayName
        , _context.Guilds.First().DisplayName);

      Assert.AreEqual(guild.Snowflake
        , _context.Guilds.First().Snowflake);
    }

    [Test]
    public void AddOrUpdate_Add_Two()
    {
      Guild guild1 = new Guild(1, "bar");
      _context.AddOrUpdate(guild1);

      Guild guild2 = new Guild(2, "bar");
      _context.AddOrUpdate(guild2);

      Assert.AreEqual(2
        , _context.Guilds.Local.Count);

      Assert.AreEqual(EntityState.Added
        , _context.Entry(guild1).State);

      Assert.AreEqual(EntityState.Added
        , _context.Entry(guild2).State);

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      ResetContext();

      Assert.AreEqual(2
        , _context.Guilds.Local.Count);
    }

    [Test]
    public void GetGuild()
    {
      Assert.DoesNotThrow(delegate
      {
        _context.Add(new Guild(1, "foo"));
      });

      Assert.AreSame(_context.Guilds.Local.First()
        , _context.GetGuild(1));
    }

    [Test]
    public void AssignAttributes()
    {
      Guild guild1 = new Guild(1, "foo");
      Guild guild2 = new Guild(2, "bar");

      Assert.DoesNotThrow(delegate
      {
        guild1.AssignAttributes(guild2);
      });

      Assert.AreEqual(guild2.DisplayName
        , guild1.DisplayName);

      Assert.AreEqual(guild2.Snowflake
        , guild1.Snowflake);
    }
  }
}
