using System;
using System.Collections.Generic;
using System.Text;

namespace RaceAnnouncer.Bot.Common
{
  public static class Logger
  {
    public static void Debug(string message)
      => Write(LogLevel.DBG, message);

    public static void Error(string message)
      => Write(LogLevel.ERR, message);

    public static void Warning(string message)
      => Write(LogLevel.WRN, message);

    public static void Info(string message)
      => Write(LogLevel.INF, message);

    private static void Write(LogLevel level, string message)
      => Console.WriteLine($"[{DateTime.Now}] {level}: {message}");

    private enum LogLevel : uint
    {
      INF = 0,
      DBG = 1,
      ERR = 2,
      WRN = 3
    }
  }
}
