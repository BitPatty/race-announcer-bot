﻿using System;
using System.IO;
using System.Reflection;

namespace RaceAnnouncer.Common
{
  public static class Credentials
  {
    /// <summary>
    /// Builds the connection string based on the environment variables
    /// </summary>
    /// <param name="envPath">The path to the environment file</param>
    /// <returns>Returns the connection string</returns>
    public static string BuildConnectionString(string? envPath = null)
    {

      if (envPath == null)
      {
        string fallbackPath = Path.Combine(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location), ".env");
        return BuildConnectionString(fallbackPath);
      }

      if (!File.Exists(envPath) && String.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("DB_NAME")))
        throw new IOException("Environment not set!");

      DotNetEnv.Env.Load(envPath);

      string database   /**/ = Environment.GetEnvironmentVariable("DB_NAME")     /**/ ?? "";
      string server     /**/ = Environment.GetEnvironmentVariable("DB_SERVER")   /**/ ?? "localhost";
      string port       /**/ = Environment.GetEnvironmentVariable("DB_PORT")     /**/ ?? "3306";
      string user       /**/ = Environment.GetEnvironmentVariable("DB_USER")     /**/ ?? "";
      string pass       /**/ = Environment.GetEnvironmentVariable("DB_PASS")     /**/ ?? "";

      return $"Server={server};Port={port};Database={database};User={user};Password={pass};TreatTinyAsBoolean=true;DateTimeKind=Utc;Convert Zero Datetime=true;";
    }

    /// <summary>
    /// Loads the discord bot token from the environment file
    /// </summary>
    /// <param name="envPath">The path to the environment file</param>
    /// <returns>Returns the discord bot token</returns>
    public static string? ParseDiscordToken(string? envPath = null)
    {
      DotNetEnv.Env.Load(envPath ?? Path.Combine(Directory.GetCurrentDirectory(), ".env"));
      return Environment.GetEnvironmentVariable("DISCORD_TOKEN");
    }
  }
}