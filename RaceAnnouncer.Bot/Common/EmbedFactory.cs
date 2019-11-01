using System;
using System.Linq;
using Discord;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.Bot.Common
{
  public static class EmbedFactory
  {
    public static Embed Build(Race race)
    => new EmbedBuilder()
    {
      Title           /**/ = $"Race room: {race.SrlId}",
      Url             /**/ = $"http://www.speedrunslive.com/race/?id={race.SrlId}",
      Description     /**/ = $"Goal: {race.Goal ?? "-"}",
      Fields          /**/ = {
                                new EmbedFieldBuilder()
                                {
                                  IsInline = false,
                                  Name = "Entrants",
                                  Value = race.Entrants.Count == 0
                                    ? "-"
                                    : race.Entrants.Count <= 15
                                    ? String.Join("\r\n", race
                                      .Entrants
                                      .OrderBy(e => e.Place > 0 ? e.Place : 99)
                                      .ThenBy(e => e.State)
                                      .ThenBy(e => e.DisplayName)
                                      .Select(FormatEntrantStatus))
                                    : String.Join("\r\n", race
                                      .Entrants
                                      .OrderBy(e => e.Place > 0 ? e.Place : 99)
                                      .ThenBy(e => e.State)
                                      .ThenBy(e => e.DisplayName)
                                      .Take(15)
                                      .Select(FormatEntrantStatus))
                                      + $"\r\n *+{race.Entrants.Count - 15} more..*"
                                }
                              },
      Footer          /**/ = new EmbedFooterBuilder() { Text = FormatRaceStatus(race) },
      Color           /**/ = GetStatusColor(race),
      Timestamp       /**/ = DateTime.Now
    }.Build();

    private static string FormatEntrantStatus(Entrant entrant)
      => entrant.State switch
      {
        SRLApiClient.Endpoints.EntrantState.Disqualified    /**/ => $"**{entrant.DisplayName}**: *DQ*",
        SRLApiClient.Endpoints.EntrantState.Forfeit         /**/ => $"**{entrant.DisplayName}**: *Forfeit*",
        SRLApiClient.Endpoints.EntrantState.Done            /**/ => $"**{entrant.DisplayName}**: {FormatSeconds(entrant.Time)}",
        _                                                   /**/ => $"**{entrant.DisplayName}**: {entrant.State.ToString()}"
      };

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

    private static Color GetStatusColor(Race race)
      => race.State switch
      {
        SRLApiClient.Endpoints.RaceState.EntryOpen          /**/  => Color.Green,
        SRLApiClient.Endpoints.RaceState.Finished           /**/  => Color.Red,
        SRLApiClient.Endpoints.RaceState.Over               /**/  => Color.Red,
        SRLApiClient.Endpoints.RaceState.Unknown            /**/  => Color.LightGrey,
        _                                                   /**/  => Color.LightOrange,
      };

    private static string FormatSeconds(int? seconds)
      => TimeSpan.FromSeconds(seconds ?? 0).ToString(@"hh\:mm\:ss");
  }
}
