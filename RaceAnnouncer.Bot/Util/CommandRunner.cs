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

      if (commandType == CommandType.INVALID || args == null) return;

      switch (commandType)
      {
        case CommandType.ADD_TRACKER: AddTracker(message, discordService, context, args); break;
        case CommandType.REMOVE_TRACKER: RemoveTracker(message, discordService, context, args); break;
      }
    }

    private static void AddTracker(SocketMessage message, DiscordService discordService, DatabaseContext context, string[] args)
    {
      if (args.Length < 3) return;
      if (message.MentionedChannels.Count != 1) return;

      Game? game = context.GetGame(args[3]);

      if (game == null) return;

      SocketGuildChannel mentionedChannel = message.MentionedChannels.First();
      Channel? channel = context.GetChannel(mentionedChannel.Id);

      if (channel == null) return;
      if (!channel.GuildId.Equals(mentionedChannel.Guild.Id)) return;
      if (discordService.HasWritePermission(mentionedChannel.Id, mentionedChannel.Guild.Id) != true) return;

      Tracker tracker = new Tracker(channel, game)
      {
        State = TrackerState.Active
      };

      context.AddOrUpdate(tracker);
    }

    private static void RemoveTracker(SocketMessage message, DiscordService discordService, DatabaseContext context, string[] args)
    {
      if (args.Length < 3) return;

      Game? game = context.GetGame(args[3]);

      if (game == null) return;

      Channel? channel = context.GetChannel(message.Channel.Id);

      if (channel == null || channel.Guild == null) return;

      Tracker? tracker = context.GetActiveTracker(game, channel.Guild);

      if (tracker == null) return;

      tracker.State = TrackerState.Paused;
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

      return MapCommand(args[2]);
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
