using System.IO;

namespace RaceAnnouncer.Tests.TestHelpers
{
  public static class TestFiles
  {
    public static string EnvFile => Path.Combine(Directory.GetCurrentDirectory(), ".config.test");

    public static string EnvFile_Alt => $"{EnvFile}.alt";

    public static string EnvFile_Not => $"{EnvFile}.not";
  }
}
