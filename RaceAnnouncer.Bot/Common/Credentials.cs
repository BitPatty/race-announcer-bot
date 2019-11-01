using System;
using System.IO;

namespace RaceAnnouncer.Bot.Common
{
  public static class Credentials
  {
    public static string ParseConnectionString(string? envPath = null)
    {
      DotNetEnv.Env.Load(envPath ?? Path.Combine(Directory.GetCurrentDirectory(), ".env"));

      string database   /**/ = Environment.GetEnvironmentVariable("DB_NAME")     /**/ ?? "";
      string server     /**/ = Environment.GetEnvironmentVariable("DB_SERVER")   /**/ ?? "localhost";
      string port       /**/ = Environment.GetEnvironmentVariable("DB_PORT")     /**/ ?? "3306";
      string user       /**/ = Environment.GetEnvironmentVariable("DB_USER")     /**/ ?? "";
      string pass       /**/ = Environment.GetEnvironmentVariable("DB_PASS")     /**/ ?? "";

      return $"Server={server};Port={port};Database={database};User={user};Password={pass};TreatTinyAsBoolean=true;DateTimeKind=Utc;Convert Zero Datetime=true;";
    }

    public static string ParseDiscordToken(string? envPath = null)
    {
      DotNetEnv.Env.Load(envPath ?? Path.Combine(Directory.GetCurrentDirectory(), ".env"));

      return Environment.GetEnvironmentVariable("DISCORD_TOKEN") ?? throw new Exception("foo");
    }
  }
}
