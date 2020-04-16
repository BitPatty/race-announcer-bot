using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using Discord.WebSocket;
using RaceAnnouncer.Bot.Data.Controllers;
using RaceAnnouncer.Bot.Services;
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
    }

    private static readonly Regex _whitespaceRegex = new Regex(@"\s+", RegexOptions.None);

    public static void Run(SocketMessage message, DiscordService discordService, DatabaseContext context)
    {
      CommandType commandType = ParseCommandType(message.Content, out string[]? args);

      if (commandType == CommandType.INVALID || args == null)
      {
        if (args != null && args.Length >= 2)
        {
          discordService.Reply(message, $"Failed to parse command {args[2]}").Wait();
        }
        else
        {
          discordService.Reply(message, "Failed to parse command").Wait();
        }

        return;
      }

      switch (commandType)
      {
        case CommandType.ADD_TRACKER: AddTracker(message, discordService, context, args); return;
        case CommandType.REMOVE_TRACKER: RemoveTracker(message, discordService, context, args); return;
      }
    }

    private static void AddTracker(SocketMessage message, DiscordService discordService, DatabaseContext context, string[] args)
    {
      if (args.Length < 3)
      {
        discordService.Reply(message, $"Invalid argument length: {args.Length}").Wait();
        return;
      }

      if (message.MentionedChannels.Count != 1)
      {
        discordService.Reply(message, "No channel specified!").Wait();
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
        discordService.Reply(message, "Channel not found").Wait();
        return;
      }

      if (!channel.Guild.Snowflake.Equals(mentionedChannel.Guild.Id))
      {
        discordService.Reply(message, "Invalid channel").Wait();
        return;
      }

      if (discordService.HasWritePermission(channel.Guild.Snowflake, channel.Snowflake) != true)
      {
        discordService.Reply(message, $"Missing write permission in channel {mentionedChannel.Name}").Wait();
        return;
      }

      Tracker tracker = new Tracker(channel, game)
      {
        State = TrackerState.Active
      };

      context.AddOrUpdate(tracker);

      discordService.Reply(message, "Tracker added/udpated!").Wait();
    }

    private static void RemoveTracker(SocketMessage message, DiscordService discordService, DatabaseContext context, string[] args)
    {
      if (args.Length < 3)
      {
        discordService.Reply(message, $"Invalid argument length: {args.Length}").Wait();
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

      tracker.State = TrackerState.Paused;

      discordService.Reply(message, "Tracker paused").Wait();
    }

    private static CommandType ParseCommandType(string command, out string[]? args)
    {
      if (command == null)
      {
        args = null;
        return CommandType.INVALID;
      }

      string formattedCommand = _whitespaceRegex.Replace(command.Trim().ToLower(), " ");
      args = formattedCommand.Split(" ");

      if (args.Length < 3) return CommandType.INVALID;

      return MapCommand(args[1]);
    }

    private static CommandType MapCommand(string key)
      => key switch
      {
        "track"     /**/ => CommandType.ADD_TRACKER,
        "untrack"   /**/ => CommandType.REMOVE_TRACKER,
        _           /**/ => CommandType.INVALID
      };
  }
}
