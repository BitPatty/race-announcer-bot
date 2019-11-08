using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using RaceAnnouncer.Tests.TestHelpers;
using RaceAnnouncer.Schema.Models;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Bot.Data.Controllers;

namespace RaceAnnouncer.Tests.Controllers
{
  public class ChannelController
  {
    private DatabaseContext _context = ContextHelper.GetContext();

    [SetUp]
    public void Setup()
    {
      ResetContext();
      ResetDatabase();
      ResetContext();

      _context.Guilds.Add(new Guild(1, "Guild 1"));
      _context.Guilds.Add(new Guild(2, "Guild 2"));
      _context.Guilds.Add(new Guild(3, "Guild 3"));
      _context.Guilds.Add(new Guild(4, "Guild 4"));
      _context.SaveChanges();

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

      Assert.AreEqual(0, _context.Guilds.Count());
    }

    [Test]
    public void AddOrUpdate_Add_One()
    {
      Guild guild = null!;
      Assert.DoesNotThrow(delegate
      {
        guild = _context.Guilds.Local.First();
      });

      Channel channel = new Channel(guild, 1, "bar");

      Assert.DoesNotThrow(delegate
      {
        _context.AddOrUpdate(channel);
      });

      Assert.AreEqual(1
        , _context.Channels.Local.Count);

      Assert.AreSame(channel
        , _context.Channels.Local.First());

      Assert.AreEqual(EntityState.Added
        , _context.Entry(channel).State);

      Assert.DoesNotThrow(delegate
      {
        _context.SaveChanges();
      });

      ResetContext();

      Assert.AreEqual(1
        , _context.Channels.Local.Count);

      Assert.AreNotSame(channel
        , _context.Channels.Local.First());

      Assert.AreEqual(channel.DisplayName
        , _context.Channels.First().DisplayName);

      Assert.AreEqual(channel.Snowflake
        , _context.Channels.First().Snowflake);

      Assert.AreEqual(1
        , channel.Guild.Snowflake);

      Assert.IsNotNull(channel.Guild);
    }

    [Test]
    public void GetChannel()
    {
      Guild guild = null!;

      Assert.DoesNotThrow(delegate
      {
        guild =
          _context
          .Guilds
          .Local
          .Single(g => g.Snowflake == 1);
      });

      Channel channel = new Channel(guild, 1, "foo");

      _context.AddOrUpdate(channel);
      _context.SaveChanges();

      ResetContext();
      Guild dbGuild = null!;
      Channel? dbChannel = null;
      Assert.DoesNotThrow(delegate
      {
        dbGuild =
          _context
          .Guilds
          .Local
          .Single(g => g.Snowflake == 1);
      });

      Assert.DoesNotThrow(delegate
      {
        dbChannel = _context.GetChannel(1);
      });

      Assert.IsNotNull(dbChannel);

      Assert.AreEqual(channel.DisplayName
        , dbChannel?.DisplayName);

      Assert.AreEqual(channel.Snowflake
        , dbChannel?.Snowflake);

      Assert.AreEqual(channel.Guild.Snowflake
        , dbChannel?.Guild.Snowflake);

      Assert.AreEqual(channel.Guild.Snowflake
        , dbGuild.Snowflake);
    }

    [Test]
    public void GetChannel_NULL()
    {
      Channel? channel = null;

      Assert.DoesNotThrow(delegate
      {
        channel = _context.GetChannel(1);
      });

      Assert.IsNull(channel);
    }

    [Test]
    public void AssignAttributes()
    {
      Guild guild1 = null!;
      Guild guild2 = null!;

      Assert.DoesNotThrow(delegate
      {
        guild1 =
          _context
          .Guilds
          .Local
          .Single(g => g.Snowflake == 1);
      });

      Assert.DoesNotThrow(delegate
      {
        guild2 =
          _context
          .Guilds
          .Local
          .Single(g => g.Snowflake == 2);
      });

      Channel channel1 = new Channel(guild1, 1, "foo");
      Channel channel2 = new Channel(guild2, 2, "bar");

      channel1.AssignAttributes(channel2);

      Assert.AreEqual(channel2.DisplayName
        , channel1.DisplayName);

      Assert.AreSame(channel2.Guild
        , channel1.Guild);
    }
  }
}
