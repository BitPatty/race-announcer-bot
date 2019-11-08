using NUnit.Framework;
using RaceAnnouncer.Bot.Data.Controllers;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.Tests.Controllers
{
  [System.Diagnostics.CodeAnalysis.SuppressMessage("Nullable", "CS8600:Converting null literal or possible null value to non-nullable type.", Justification = "Assertion")]
  [System.Diagnostics.CodeAnalysis.SuppressMessage("Nullable", "CS8602:Dereference of a possibly null reference.", Justification = "Assertion")]
  [System.Diagnostics.CodeAnalysis.SuppressMessage("Nullable", "CS8604:Possible null reference argument for parameter.", Justification = "Assertion")]
  public class GuildController : BaseControllerTest
  {
    [SetUp]
    public override void _Setup()
    {
      ResetContext();
    }

    [Test]
    public override void AddOrUpdate_Add_Duplicate_Keeps_Count()
    {
      int guildCount = _context.Guilds.Local.Count;
      _context.AddOrUpdate(RandomLocalGuild);
      SaveChanges();
      Assert.AreEqual(guildCount, _context.Guilds.Local.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Increases_Count()
    {
      int guildCount = _context.Guilds.Local.Count;
      _context.AddOrUpdate(GenerateGuild());
      SaveChanges();
      Assert.AreEqual(guildCount + 1, _context.Guilds.Local.Count);
    }

    [Test]
    public override void AddOrUpdate_Add_Stored_Correctly()
    {
      Guild g1 = _context.AddOrUpdate(GenerateGuild());
      SaveChanges();

      Guild g2 = _context.GetGuild(g1.Snowflake);
      Assert.AreEqual(g1.Snowflake, g2.Snowflake);
      Assert.AreEqual(g1.DisplayName, g2.DisplayName);
    }

    [Test]
    public override void AssignAttributes_Assigns_All_Attributes()
    {
      Guild g1 = GenerateGuild();
      Guild g2 = RandomLocalGuild;

      g2.AssignAttributes(g1);
      Assert.AreEqual(g1.DisplayName, g2.DisplayName);
      Assert.AreEqual(g1.Snowflake, g2.Snowflake);
    }

    [Test]
    public void GetGuild_Returns_Guild()
    {
      Assert.IsNotNull(_context.GetGuild(RandomLocalGuild.Snowflake));
    }

    [Test]
    public void GetGuild_Returns_NULL()
    {
      Assert.IsNull(_context.GetGuild(GenerateGuild().Snowflake));
    }
  }
}
