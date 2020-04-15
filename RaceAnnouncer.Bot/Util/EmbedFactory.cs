using System;
using System.Collections.Generic;
using System.Linq;
using Discord;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.Bot.Util
{
  public static class EmbedFactory
  {
    /// <summary>
    /// Creates a new embed for the specified <paramref name="race"/>
    /// </summary>
    /// <param name="race">The race entity</param>
    /// <returns>Returns the embed for the specified <paramref name="race"/></returns>
    public static Embed Build(Race race, List<Entrant> entrants)
    => new EmbedBuilder()
    {
      Title           /**/ = $"Race room: #{race.SrlId}",
      Url             /**/ = $"http://www.speedrunslive.com/race/?id={race.SrlId}",
      Description     /**/ = $"Goal: {FormatGoal(race)}",
      Fields          /**/ = {
                                new EmbedFieldBuilder()
                                {
                                  IsInline = false,
                                  Name = "Entrants",
                                  Value = entrants.Count == 0
                                    ? "-"
                                    : entrants.Count <= 15
                                    ? string.Join("\r\n", race
                                      .Entrants
                                      .OrderBy(e => e.Place > 0 ? e.Place : 99)
                                      .ThenBy(e => e.State)
                                      .ThenBy(e => e.DisplayName)
                                      .Select(FormatEntrantStatus))
                                    : string.Join("\r\n", race
                                      .Entrants
                                      .OrderBy(e => e.Place > 0 ? e.Place : 99)
                                      .ThenBy(e => e.State)
                                      .ThenBy(e => e.DisplayName)
                                      .Take(15)
                                      .Select(FormatEntrantStatus))
                                      + $"\r\n *+{entrants.Count - 15} more..*"
                                }
                              },
      Footer          /**/ = new EmbedFooterBuilder() { Text = FormatRaceStatus(race) },
      Color           /**/ = GetStatusColor(race),
      Timestamp       /**/ = DateTime.Now
    }.Build();

    /// <summary>
    /// Formats the state string for the specified <paramref name="entrant"/>
    /// </summary>
    /// <param name="entrant">The entrant entity</param>
    /// <returns>Returns the formatted string for the specified <paramref name="entrant"/></returns>
    private static string FormatEntrantStatus(Entrant entrant)
      => entrant.State switch
      {
        SRLApiClient.Endpoints.EntrantState.Disqualified    /**/ => $"**{entrant.DisplayName}**: *DQ*",
        SRLApiClient.Endpoints.EntrantState.Forfeit         /**/ => $"**{entrant.DisplayName}**: *Forfeit*",
        SRLApiClient.Endpoints.EntrantState.Done            /**/ => $"**{entrant.DisplayName}**: Finished ({FormatSeconds(entrant.Time)})",
        _                                                   /**/ => $"**{entrant.DisplayName}**: {entrant.State}"
      };

    /// <summary>
    /// Formats the goal according to discord character limit
    /// </summary>
    /// <param name="race">The race entity</param>
    /// <returns>Returns the formatted goal description</returns>
    private static string FormatGoal(Race race)
    {
      if (race.Goal == null) return "-";

      string goal = race.Goal.Replace("&amp;", "&");

      if (goal.Length > 2000) return goal.Substring(0, 1800) + "...";
      return goal;
    }

    /// <summary>
    /// Formats the state string for the specified <paramref name="race"/>
    /// </summary>
    /// <param name="race">The race entity</param>
    /// <returns>Returns the formatted string for the specified <paramref name="race"/></returns>
    private static string FormatRaceStatus(Race race)
      => race.State switch
      {
        SRLApiClient.Endpoints.RaceState.EntryOpen          /**/  => "Entry Open",
        SRLApiClient.Endpoints.RaceState.EntryClosed        /**/  => "Entry Closed",
        SRLApiClient.Endpoints.RaceState.InProgress         /**/  => "In Progress",
        SRLApiClient.Endpoints.RaceState.Finished           /**/  => "Race Finished",
        SRLApiClient.Endpoints.RaceState.Over               /**/  => "Race Over",
        _                                                   /**/  => "Unknown State",
      };

    /// <summary>
    /// Gets the embeds display color base on the <paramref name="race"/> state
    /// </summary>
    /// <param name="race">The race entity</param>
    /// <returns>Returns the embeds display color</returns>
    private static Color GetStatusColor(Race race)
      => race.State switch
      {
        SRLApiClient.Endpoints.RaceState.EntryOpen          /**/  => Color.Green,
        SRLApiClient.Endpoints.RaceState.Finished           /**/  => Color.Red,
        SRLApiClient.Endpoints.RaceState.Over               /**/  => Color.Red,
        SRLApiClient.Endpoints.RaceState.Unknown            /**/  => Color.LightGrey,
        _                                                   /**/  => Color.LightOrange,
      };

    /// <summary>
    /// Formats a number of seconds to a human readable form
    /// </summary>
    /// <param name="seconds">The number of seconds</param>
    /// <returns>Returns the human readable representation of the <paramref name="seconds"/></returns>
    private static string FormatSeconds(int? seconds)
      => TimeSpan.FromSeconds(seconds ?? 0).ToString(@"hh\:mm\:ss");
  }
}
