using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using Discord.WebSocket;
using RaceAnnouncer.Bot.Data.Controllers;
using RaceAnnouncer.Bot.Services;
using RaceAnnouncer.Common;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Schema.Models;
using RaceAnnouncer.Schema.Models.Enumerations;

namespace RaceAnnouncer.Bot.Util
{
  public static class CommandRunner
  {
    private enum CommandType
    {
      INVALID,
      ADD_TRACKER,
      REMOVE_TRACKER,
      LIST
    }

    private static readonly Regex _whitespaceRegex = new Regex(@"\s+", RegexOptions.None);

    /// <summary>
    /// Runs a command
    /// </summary>
    /// <param name="message">The request message</param>
    /// <param name="discordService">The discord service</param>
    public static void Run(
      SocketMessage message
      , DiscordService discordService
    )
    {
      using DatabaseContext context = new ContextBuilder().CreateDbContext();

      context.LoadRemote();
      context.ChangeTracker.DetectChanges();

      CommandType commandType = ParseCommandType(message.Content, out string[]? args);

      if (commandType == CommandType.INVALID || args == null)
      {
        discordService.Reply(message, "Invalid command").Wait();
        return;
      }

      switch (commandType)
      {
        case CommandType.ADD_TRACKER:
          AddTracker(message, discordService, context, args);
          return;
        case CommandType.REMOVE_TRACKER:
          RemoveTracker(message, discordService, context, args);
          return;
        case CommandType.LIST:
          ListTrackers(message, discordService, context);
          return;
      }
    }

    /// <summary>
    /// Lists trackers for the guild in which the command was sent in
    /// </summary>
    /// <param name="message">The request message</param>
    /// <param name="discordService">The discord service</param>
    /// <param name="context">The database context</param>
    private static void ListTrackers(
      SocketMessage message
      , DiscordService discordService
      , DatabaseContext context
    )
    {
      Channel? channel = context.GetChannel(message.Channel.Id);

      if (channel == null) return;

      IEnumerable<Tracker> trackers = context.GetActiveTrackers(channel.Guild);

      if (!trackers.Any())
      {
        discordService
          .Reply(message, "No active trackers found!")
          .Wait();

        return;
      }

      int gameAbbreviationLength = Math
        .Max(trackers
          .OrderByDescending(t => t.Game.Abbreviation.Length)
          .Select(t => t.Game)
          .First()
          .Abbreviation.Length + 2
        , "Abbreviation".Length + 2);

      int gameNameLength = trackers
        .OrderByDescending(t => t.Game.Name.Length)
        .Select(t => t.Game)
        .First()
        .Name
        .Length + 2;

      string reply = "```\r\n";
      reply += "Abbreviation".PadRight(gameAbbreviationLength);
      reply += "Game".PadRight(gameNameLength);
      reply += "Channel\r\n";

      foreach (Tracker tracker in trackers)
      {
        string entry = $"{tracker.Game.Abbreviation.PadRight(gameAbbreviationLength)}{tracker.Game.Name.PadRight(gameNameLength)}#{tracker.Channel.DisplayName}";
        reply += $"{entry}\r\n";
      }

      reply += "```";

      discordService.Reply(message, reply).Wait();
    }

    /// <summary>
    /// Adds a tracker or updates it if it's already present in the current guild
    /// </summary>
    /// <param name="message">The request message</param>
    /// <param name="discordService">The discord service</param>
    /// <param name="context">The database context</param>
    /// <param name="args">The command arguments</param>
    private static void AddTracker(
      SocketMessage message,
      DiscordService discordService,
      DatabaseContext context,
      string[] args
    )
    {
      if (args.Length != 4)
      {
        Logger.Error("Invalid command pattern");
        discordService.Reply(message, "Invalid command pattern. Command usage: track <srl abbreviation> <channel mention>").Wait();
        return;
      }

      if (message.MentionedChannels.Count != 1)
      {
        discordService.Reply(message, "No channel specified! Command usage: track <srl abbreviation> <channel mention>").Wait();
        return;
      }

      Game? game = context.GetGame(args[2]);

      if (game == null)
      {
        discordService.Reply(message, $"Game abbreviation '{args[2]}' not found").Wait();
        return;
      }

      SocketGuildChannel mentionedChannel = message.MentionedChannels.First();
      Channel? channel = context.GetChannel(mentionedChannel.Id);

      if (channel == null)
      {
        discordService.Reply(message, "Channel not registered yet, please try again later.").Wait();
        return;
      }

      if (!channel.Guild.Snowflake.Equals(mentionedChannel.Guild.Id) || !channel.IsActive)
      {
        discordService.Reply(message, "Channel not found in current guild.").Wait();
        return;
      }

      if (discordService.HasRequiredPermissions(channel.Guild.Snowflake, channel.Snowflake) != true)
      {
        discordService.Reply(message, $"Missing permissions in channel #{mentionedChannel.Name}").Wait();
        return;
      }

      Tracker? tracker = context.GetActiveTracker(game, channel.Guild);

      if (tracker != null)
      {
        tracker.Channel = channel;
        tracker.State = TrackerState.Active;
      }
      else
      {
        tracker = new Tracker(channel, game)
        {
          State = TrackerState.Active
        };

        context.AddOrUpdate(tracker);
      }

      context.SaveChanges();
      discordService.Reply(message, $"{game.Abbreviation} is now being tracked in {channel.DisplayName}").Wait();
    }

    /// <summary>
    /// Disables a tracker in the current guild
    /// </summary>
    /// <param name="message">The request message</param>
    /// <param name="discordService">The discord service</param>
    /// <param name="context">The database context</param>
    /// <param name="args">The command arguments</param>
    private static void RemoveTracker(
      SocketMessage message
      , DiscordService discordService
      , DatabaseContext context
      , string[] args
    )
    {
      if (args.Length != 3)
      {
        discordService.Reply(message, "Invalid command pattern. Command usage: untrack <srl abbreviation>").Wait();
        return;
      }

      Game? game = context.GetGame(args[2]);

      if (game == null)
      {
        discordService.Reply(message, $"Unknown game abbreviation: {args[2]}").Wait();
        return;
      }

      Channel? channel = context.GetChannel(message.Channel.Id);

      if (channel == null || channel.Guild == null) return;

      Tracker? tracker = context.GetActiveTracker(game, channel.Guild);

      if (tracker == null)
      {
        discordService.Reply(message, $"No tracker for '{game.Abbreviation}' registered in guild").Wait();
        return;
      }

      tracker.State = TrackerState.Dead;
      context.SaveChanges();

      discordService.Reply(message, "Tracker removed").Wait();
    }

    /// <summary>
    /// Parses and formats the command key
    /// </summary>
    /// <param name="command">The command</param>
    /// <param name="args">The command arguments</param>
    /// <returns>Returns the command type and arguments</returns>
    private static CommandType ParseCommandType(
      string command
      , out string[]? args)
    {
      if (command == null)
      {
        args = null;
        return CommandType.INVALID;
      }

      string formattedCommand = _whitespaceRegex.Replace(command.Trim().ToLower(), " ");
      args = formattedCommand.Split(" ");

      if (args.Length < 2) return CommandType.INVALID;

      return MapCommand(args[1]);
    }

    /// <summary>
    /// Maps a command to its <see cref="CommandType"/>
    /// </summary>
    /// <param name="key">The command keyword</param>
    /// <returns>Returns the command type</returns>
    private static CommandType MapCommand(string key)
      => key switch
      {
        "track"     /**/ => CommandType.ADD_TRACKER,
        "untrack"   /**/ => CommandType.REMOVE_TRACKER,
        "list"      /**/ => CommandType.LIST,
        _           /**/ => CommandType.INVALID
      };
  }
}
