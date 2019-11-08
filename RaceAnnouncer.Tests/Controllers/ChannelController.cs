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
    public override void AddOrUpdate_Add_Duplicate_Keeps_Count()
    {
      int channelCount = _context.Channels.Local.Count;
      _context.AddOrUpdate(RandomLocalChannel);
      SaveChanges();
      Assert.AreEqual(channelCount, _context.Channels.Local.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Increases_Count()
    {
      int channelCount = _context.Channels.Local.Count;
      _context.AddOrUpdate(GenerateChannel());
      SaveChanges();
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
      Assert.AreSame(c1.Guild, c2.Guild);
    }

    [Test]
    public void GetChannel_Returns_Channel()
    {
      Assert.IsNotNull(_context.GetChannel(RandomLocalChannel.Snowflake));
    }

    [Test]
    public void GetChannel_Returns_NULL()
    {
      Assert.IsNull(_context.GetChannel(GenerateChannel().Snowflake));
    }
  }
}
