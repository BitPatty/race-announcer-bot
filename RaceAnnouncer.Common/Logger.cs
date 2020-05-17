using System;
using System.Diagnostics;

namespace RaceAnnouncer.Common
{
  public static class Logger
  {
    /// <summary>
    /// Posts a log message with the <see cref="LogLevel.DBG"/> severity
    /// </summary>
    /// <param name="message">The log message</param>
    public static void Debug(string message)
      => Write(LogLevel.DBG, message);

    /// <summary>
    /// Posts a log message with the <see cref="LogLevel.ERR"/> severity
    /// </summary>
    /// <param name="message">The log message</param>
    public static void Error(string message)
      => Write(LogLevel.ERR, message);

    /// <summary>
    /// Posts a log message with the <see cref="LogLevel.ERR"/> severity
    /// </summary>
    /// <param name="message">The log message</param>
    public static void Error(string message, Exception? exception)
    {
      Write(LogLevel.ERR, $"{message ?? "N/A"}");

      Exception? ex = exception;

      while (ex != null)
      {
        Write(LogLevel.ERR, $"{ex.GetType()}");
        Write(LogLevel.ERR, $"{ex.Message}");
        Write(LogLevel.ERR, $"{ex.StackTrace}");
        ex = ex.InnerException;
      }
    }

    /// <summary>
    /// Posts a log message with the <see cref="LogLevel.WRN"/> severity
    /// </summary>
    /// <param name="message">The log message</param>
    public static void Warning(string message)
      => Write(LogLevel.WRN, message);

    /// <summary>
    /// Posts a log message with the <see cref="LogLevel.INF"/> severity
    /// </summary>
    /// <param name="message">The log message</param>
    public static void Info(string message)
      => Write(LogLevel.INF, message);

    /// <summary>
    /// Posts a log message with the specified severity
    /// </summary>
    /// <param name="level">The severity level</param>
    /// <param name="message">The log message</param>
    private static void Write(LogLevel level, string message)
      => Console.WriteLine($"[{DateTime.Now}] {level}: {GetCallerName() ?? "N/A"} | {message ?? "N/A"}");

    /// <summary>
    /// Get name of method that called the logger
    /// </summary>
    /// <returns>Returns the name of the method</returns>
    private static string? GetCallerName()
      => new StackFrame(3, true)?.GetMethod()?.Name;

    /// <summary>
    /// The severity level of a log message
    /// </summary>
    private enum LogLevel : uint
    {
      /// <summary>
      /// Info
      /// </summary>
      INF = 0,

      /// <summary>
      /// Debug
      /// </summary>
      DBG = 1,

      /// <summary>
      /// Error
      /// </summary>
      ERR = 2,

      /// <summary>
      /// Warning
      /// </summary>
      WRN = 3
    }
  }
}
