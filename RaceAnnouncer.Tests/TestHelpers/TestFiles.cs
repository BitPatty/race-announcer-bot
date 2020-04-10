using System.IO;

namespace RaceAnnouncer.Tests.TestHelpers
{
  public static class TestFiles
  {
    public static string EnvFile => Path.Combine(Directory.GetCurrentDirectory(), "test.env");

    public static string EnvFile_Alt => Path.Combine(Directory.GetCurrentDirectory(), "test.alt.env");

    public static string EnvFile_Not => Path.Combine(Directory.GetCurrentDirectory(), "test.none.env");
  }
}
