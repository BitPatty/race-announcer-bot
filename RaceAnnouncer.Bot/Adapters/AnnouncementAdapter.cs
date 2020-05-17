using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Discord.Rest;
using Microsoft.EntityFrameworkCore;
using RaceAnnouncer.Bot.Data.Controllers;
using RaceAnnouncer.Bot.Services;
using RaceAnnouncer.Bot.Util;
using RaceAnnouncer.Common;
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
    public static async Task UpdateAnnouncementsAsync(
      DatabaseContext context
      , DiscordService discordService
      , List<Race> races)
    {
      foreach (Race race in races)
      {
        foreach (Tracker tracker in context.GetActiveTrackers(race.Game))
        {
          Logger.Info($"({race.SrlId}) Updating tracker {tracker.Id}");

          Announcement? announcement = context.GetAnnouncement(race, tracker);

          try
          {
            if (discordService.HasRequiredPermissions(tracker.Channel.Guild.Snowflake, announcement?.Channel?.Snowflake ?? tracker.Channel.Snowflake) != true)
            {
              Logger.Error($"Missing permissions in channel {tracker.ChannelId}: {tracker.Channel.Guild.DisplayName}/{tracker.Channel.DisplayName}");
              continue;
            }
          }
          catch (Exception ex)
          {
            Logger.Error($"({announcement?.Race?.SrlId}) Exception thrown:", ex);
            continue;
          }

          List<Entrant> entrants = new List<Entrant>();

          foreach (Entrant e in context.GetEntrants(race))
          {
            if (context.Entry(e).State != EntityState.Deleted)
              entrants.Add(e);
          }

          if (
            announcement == null
            && race.State < SRLApiClient.Endpoints.RaceState.Finished
            && race.State != SRLApiClient.Endpoints.RaceState.Unknown
          )
          {
            DateTime controlRange = DateTime.UtcNow.Subtract(TimeSpan.FromDays(7));

            using DatabaseContext altContext = new ContextBuilder().CreateDbContext();
            Race? persistedRace = await altContext
              .Races
              .AsQueryable()
              .FirstOrDefaultAsync(r => r
                .SrlId.Equals(race.SrlId, StringComparison.CurrentCultureIgnoreCase)
                  && r.CreatedAt > controlRange)
              .ConfigureAwait(false);

            if (persistedRace != null)
            {
              // If a race with the same id was registered within the last week, skip announcement
              Logger.Info($"({race.SrlId}) Persisted race found: {persistedRace.Id}/{persistedRace.SrlId}. Skipping announcement!");
            }
            else
            {
              announcement = await PostAnnouncementAsync(discordService, tracker, race, entrants).ConfigureAwait(false);
              if (announcement != null) context.AddOrUpdate(announcement);
            }
          }
          else if (announcement != null)
          {
            await UpdateAnnouncementAsync(discordService, announcement, entrants).ConfigureAwait(false);
          }
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
    private static async Task<Announcement?> PostAnnouncementAsync(DiscordService discordService, Tracker tracker, Race race, List<Entrant> entrants)
    {
      Logger.Info($"({race.SrlId}) Posting announcement in channel {tracker.ChannelId}: {tracker.Channel.Guild.DisplayName}/{tracker.Channel.DisplayName}.");

      try
      {
        RestUserMessage? message = await discordService
           .SendEmbedAsync(tracker.Channel.Snowflake, EmbedFactory.Build(race, entrants)).ConfigureAwait(false);

        if (message != null)
        {
          return new Announcement(tracker.Channel, tracker, race, message.Id)
          { MessageCreatedAt = DateTime.UtcNow };
        }
      }
      catch (Exception ex)
      {
        Logger.Error($"({race.SrlId}) Exception thrown", ex);
      }

      return null;
    }

    /// <summary>
    /// Attempts to update an existing announcement
    /// </summary>
    /// <param name="discordService">The discord service</param>
    /// <param name="announcement">The target announcement</param>
    private static async Task UpdateAnnouncementAsync(DiscordService discordService, Announcement announcement, List<Entrant> entrants)
    {
      Logger.Info($"({announcement.Race.SrlId}) Updating announcement {announcement.Snowflake} in channel {announcement.ChannelId}: {announcement.Channel.Guild.DisplayName}/{announcement.Channel.DisplayName}.");

      RestUserMessage? message = await discordService.FindMessageAsync(announcement.Channel, announcement.Snowflake).ConfigureAwait(false);

      if (message != null)
      {
        try
        {
          await discordService.ModifyMessageAsync(message, EmbedFactory.Build(announcement.Race, entrants)).ConfigureAwait(false);
          announcement.MessageUpdatedAt = DateTime.UtcNow;
        }
        catch (Exception ex)
        {
          Logger.Error($"({announcement.Race.SrlId}) Exception thrown", ex);
        }
      }
      else
      {
        Logger.Info($"({announcement.Race.SrlId}) Failed to fetch message {announcement.Snowflake} in channel {announcement.ChannelId}: {announcement.Channel.Guild.DisplayName}/{announcement.Channel.DisplayName}.");
      }
    }
  }
}
