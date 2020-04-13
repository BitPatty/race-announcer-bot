using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;

namespace RaceAnnouncer.WebAPI
{
  /// <summary>
  /// Main entry point
  /// </summary>
  public static class Program
  {
    /// <summary>
    /// Main entry point
    /// </summary>
    /// <param name="args"></param>
    public static void Main(string[] args)
    {
      CreateHostBuilder(args).Build().Run();
    }

    /// <summary>
    /// Initializes the host builder
    /// </summary>
    /// <param name="args">the args</param>
    /// <returns>Returns the host builder</returns>
    public static IHostBuilder CreateHostBuilder(string[] args) =>
        Host.CreateDefaultBuilder(args)
            .ConfigureWebHostDefaults(webBuilder => webBuilder.UseStartup<Startup>());
  }
}
