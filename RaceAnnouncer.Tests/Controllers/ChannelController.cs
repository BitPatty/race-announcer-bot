using System.Linq;
using NUnit.Framework;
using RaceAnnouncer.Bot.Data.Controllers;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.Tests.Controllers
{
  [System.Diagnostics.CodeAnalysis.SuppressMessage("Nullable", "CS8600:Converting null literal or possible null value to non-nullable type.", Justification = "Assertion")]
  [System.Diagnostics.CodeAnalysis.SuppressMessage("Nullable", "CS8602:Dereference of a possibly null reference.", Justification = "Assertion")]
  [System.Diagnostics.CodeAnalysis.SuppressMessage("Nullable", "CS8604:Possible null reference argument for parameter.", Justification = "Assertion")]
  public class ChannelController : BaseControllerTest
  {
    [SetUp]
    public override void _Setup()
    {
      ResetContext();
    }

    [Test]
    public override void AddOrUpdate_Add_Duplicate_Keeps_Collection_Count_After_Save()
    {
      Channel? channel = RandomLocalChannel;
      int cntGuild = channel.Guild.Channels.Count;

      _context.AddOrUpdate(channel);
      SaveChanges();

      Guild guild = _context.GetGuild(channel.Guild.Snowflake);

      Assert.IsNotNull(guild);
      Assert.AreEqual(cntGuild, guild.Channels.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Duplicate_Keeps_Collection_Count_Before_Save()
    {
      Channel? channel = RandomLocalChannel;
      int cntGuild = channel.Guild.Channels.Count;
      _context.AddOrUpdate(channel);

      Assert.AreEqual(cntGuild, channel.Guild.Channels.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Duplicate_Keeps_Total_Count_After_Save()
    {
      int channelCount = _context.Channels.Local.Count;
      _context.AddOrUpdate(RandomLocalChannel);
      SaveChanges();

      Assert.AreEqual(channelCount, _context.Channels.Local.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Duplicate_Keeps_Total_Count_Before_Save()
    {
      int channelCount = _context.Channels.Local.Count;
      _context.AddOrUpdate(RandomLocalChannel);

      Assert.AreEqual(channelCount, _context.Channels.Local.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Increases_Collection_Count_After_Save()
    {
      Guild? guild = RandomLocalGuild;
      Channel channel = GenerateChannel(guild);

      int cntGuild = guild.Channels.Count;

      _context.AddOrUpdate(channel);
      SaveChanges();

      guild = _context.GetGuild(guild.Snowflake);

      Assert.IsNotNull(guild);
      Assert.AreEqual(cntGuild + 1, guild.Channels.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Increases_Collection_Count_Before_Save()
    {
      Guild guild = RandomLocalGuild;
      Channel channel = GenerateChannel(guild);

      int cntGuild = guild.Channels.Count;

      _context.AddOrUpdate(channel);

      Assert.AreEqual(cntGuild + 1, guild.Channels.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Increases_Total_Count_After_Save()
    {
      int channelCount = _context.Channels.Local.Count;
      _context.AddOrUpdate(GenerateChannel());
      SaveChanges();

      Assert.AreEqual(channelCount + 1, _context.Channels.Local.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Increases_Total_Count_Before_Save()
    {
      int channelCount = _context.Channels.Local.Count;
      _context.AddOrUpdate(GenerateChannel());

      Assert.AreEqual(channelCount + 1, _context.Channels.Local.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Stored_Correctly()
    {
      Channel c1 = _context.AddOrUpdate(GenerateChannel());
      SaveChanges();
      Channel c2 = _context.GetChannel(c1.Snowflake);

      Assert.AreEqual(c1.Snowflake, c2.Snowflake);
      Assert.AreEqual(c1.DisplayName, c2.DisplayName);
    }

    [Test]
    public override void AssignAttributes_Assigns_All_Attributes()
    {
      Channel c1 = GenerateChannel();
      Channel c2 = RandomLocalChannel;
      c2.AssignAttributes(c1);

      Assert.AreEqual(c1.DisplayName, c2.DisplayName);
      Assert.AreEqual(c1.Snowflake, c2.Snowflake);
      Assert.AreEqual(c1.IsActive, c2.IsActive);
      Assert.AreSame(c1.Guild, c2.Guild);
    }

    [Test]
    public void DisableChannelsByGuild_Disables_Channels()
    {
      Guild guild = RandomLocalChannel.Guild;
      Assert.IsTrue(guild.Channels.All(c => c.IsActive));

      _context.DisableChannelsByGuild(guild);
      Assert.IsFalse(guild.Channels.Any(c => c.IsActive));
    }

    [Test]
    public void GetChannel_Returns_Channel()
    {
      Channel channel = RandomLocalChannel;
      Assert.AreSame(channel, _context.GetChannel(channel.Snowflake));
    }

    [Test]
    public void GetChannel_Returns_NULL()
    {
      Assert.IsNull(_context.GetChannel(GenerateChannel().Snowflake));
    }
  }
}
