using System;
using System.IO;
using System.Linq;
using NUnit.Framework;
using RaceAnnouncer.Tests.TestHelpers;

namespace RaceAnnouncer.Tests.Environment
{
  public class Credentials
  {
    [SetUp]
    public void Setup()
    {
      System.Environment.SetEnvironmentVariable("DB_NAME", null);
      System.Environment.SetEnvironmentVariable("DB_SERVER", null);
      System.Environment.SetEnvironmentVariable("DB_PORT", null);
      System.Environment.SetEnvironmentVariable("DB_USER", null);
      System.Environment.SetEnvironmentVariable("DB_PASS", null);
      System.Environment.SetEnvironmentVariable("DISCORD_TOKEN", null);
    }

    [Test]
    public void ConnectionString_Valid_File()
    {
      Assert.True(File.Exists(TestFiles.EnvFile));

      string[] envContent = null!;

      Assert.DoesNotThrow(delegate
      {
        envContent = File.ReadAllLines(TestFiles.EnvFile);
      });

      Assert.IsNotNull(envContent);
      Assert.IsNotEmpty(envContent);

      string dbName = null!
        , dbServer = null!
        , dbPort = null!
        , dbUser = null!
        , dbPass = null!;

      Assert.DoesNotThrow(delegate
      {
        dbName = envContent
        .First(e => e.StartsWith("DB_NAME"))
        .Split("=", 2, StringSplitOptions.None)[1];
      });

      Assert.DoesNotThrow(delegate
      {
        dbServer = envContent
        .First(e => e.StartsWith("DB_SERVER"))
        .Split("=", 2, StringSplitOptions.None)[1];
      });

      Assert.DoesNotThrow(delegate
      {
        dbPort = envContent
        .First(e => e.StartsWith("DB_PORT"))
        .Split("=", 2, StringSplitOptions.None)[1];
      });

      Assert.DoesNotThrow(delegate
      {
        dbUser = envContent
        .First(e => e.StartsWith("DB_USER"))
        .Split("=", 2, StringSplitOptions.None)[1];
      });

      Assert.DoesNotThrow(delegate
      {
        dbPass = envContent
        .First(e => e.StartsWith("DB_PASS"))
        .Split("=", 2, StringSplitOptions.None)[1];
      });

      string connectionString = null!;

      Assert.DoesNotThrow(delegate
      {
        connectionString =
          Bot
          .Common
          .Credentials
          .BuildConnectionString(TestFiles.EnvFile);
      });

      Assert.AreEqual(
        $"Server={dbServer};Port={dbPort};Database={dbName};User={dbUser};Password={dbPass};TreatTinyAsBoolean=true;DateTimeKind=Utc;Convert Zero Datetime=true;"
        , connectionString
      );
    }

    [Test]
    public void ConnectionString_Invalid_File()
    {
      Assert.Throws<FileNotFoundException>(delegate
      {
        Bot
        .Common
        .Credentials
        .BuildConnectionString(TestFiles.EnvFile_Not);
      });
    }

    [Test]
    public void DiscordToken_Valid_File()
    {
      Assert.True(File.Exists(TestFiles.EnvFile));

      string[] envContent = null!;

      Assert.DoesNotThrow(delegate
      {
        envContent = File.ReadAllLines(TestFiles.EnvFile);
      });

      Assert.IsNotNull(envContent);
      Assert.IsNotEmpty(envContent);

      string token = null!;

      Assert.DoesNotThrow(delegate
      {
        token = envContent
        .First(e => e.StartsWith("DISCORD_TOKEN"))
        .Split("=", 2, StringSplitOptions.None)[1];
      });

      string? envToken = null;

      Assert.DoesNotThrow(delegate
      {
        envToken =
          Bot
          .Common
          .Credentials
          .ParseDiscordToken(TestFiles.EnvFile);
      });

      Assert.AreEqual(token, envToken);
    }

    [Test]
    public void DiscordToken_Invalid_File()
    {
      Assert.Throws<FileNotFoundException>(delegate
      {
        Bot
        .Common
        .Credentials
        .BuildConnectionString(TestFiles.EnvFile_Not);
      });
    }

    [Test]
    public void DiscordToken_Missing()
    {
      Assert.IsNull(
        Bot
        .Common
        .Credentials
        .ParseDiscordToken(TestFiles.EnvFile_Alt));
    }
  }
}
