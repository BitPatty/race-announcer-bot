﻿using System;
using System.Collections.Generic;
using System.Threading;
using Discord.Rest;
using RaceAnnouncer.Bot.Common;
using RaceAnnouncer.Bot.Data.Controllers;
using RaceAnnouncer.Bot.Services;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.Bot.Adapters
{
  public static class AnnouncementAdapter
  {
    /// <summary>
    /// Creates and updates announcements for the specified <paramref name="races"/>
    /// if an active tracker is found
    /// </summary>
    /// <param name="context">The database context</param>
    /// <param name="discordService">The discord service</param>
    /// <param name="races">The races</param>
    public static void UpdateAnnouncements(
      DatabaseContext context
      , DiscordService discordService
      , List<Race> races)
    {
      foreach (Race race in races)
      {
        Logger.Info($"({race.SrlId}) Updating Announcements");

        foreach (Tracker tracker in context.GetActiveTrackers(race.Game))
        {
          Announcement? announcement = context.GetAnnouncement(race, tracker);

          if (announcement == null)
          {
            announcement = PostAnnouncement(discordService, tracker, race);
            if (announcement != null) context.AddOrUpdate(announcement);
          }
          else
          {
            UpdateAnnouncement(discordService, announcement);
          }

          Thread.Sleep(1000);
        }
      }
    }

    /// <summary>
    /// Attempts to post a new announcement
    /// </summary>
    /// <param name="discordService">The discord service</param>
    /// <param name="tracker">The tracker</param>
    /// <param name="race">The race</param>
    /// <returns>On Success, returns the announcement</returns>
    private static Announcement? PostAnnouncement(DiscordService discordService, Tracker tracker, Race race)
    {
      Logger.Info($"({race.SrlId}) Posting announcement in '{tracker.Channel.Guild.DisplayName}/{tracker.Channel.DisplayName}'.");

      try
      {
        RestUserMessage? message = discordService
            .SendEmbedAsync(tracker.Channel.Snowflake, EmbedFactory.Build(race))
            .Result;

        if (message != null)
        {
          return new Announcement(tracker.Channel, tracker, race, message.Id)
          { MessageCreatedAt = DateTime.UtcNow };
        }
      }
      catch (Exception ex)
      {
        Logger.Error($"({race.SrlId}) Exception thrown: {ex.Message}");
        Logger.Error($"({race.SrlId}) Inner exception: {ex.InnerException?.Message}");
        Logger.Error($"({race.SrlId}) Stack trace: {ex.StackTrace}");
      }

      return null;
    }

    /// <summary>
    /// Attempts to update an existing announcement
    /// </summary>
    /// <param name="discordService">The discord service</param>
    /// <param name="announcement">The target announcement</param>
    private static void UpdateAnnouncement(DiscordService discordService, Announcement announcement)
    {
      Logger.Info($"({announcement.Race.SrlId}) Updating announcement {announcement.Snowflake} in '{announcement.Channel.Guild.DisplayName}/{announcement.Channel.DisplayName}'.");

      RestUserMessage? message = discordService.FindMessageAsync(announcement.Channel, announcement.Snowflake).Result;

      if (message != null)
      {
        try
        {
          discordService.ModifyMessageAsync(message, EmbedFactory.Build(announcement.Race)).Wait();
          announcement.MessageUpdatedAt = DateTime.UtcNow;
        }
        catch (Exception ex)
        {
          Logger.Error($"({announcement.Race.SrlId}) Exception thrown: {ex.Message}");
          Logger.Error($"({announcement.Race.SrlId}) Inner exception: {ex.InnerException?.Message}");
          Logger.Error($"({announcement.Race.SrlId}) Stack trace: {ex.StackTrace}");
        }
      }
      else
      {
        Logger.Info($"({announcement.Race.SrlId}) Failed to fetch message {announcement.Snowflake} in '{announcement.Channel.Guild.DisplayName}/{announcement.Channel.DisplayName}'.");
      }
    }
  }
}