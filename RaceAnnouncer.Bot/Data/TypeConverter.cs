namespace RaceAnnouncer.Bot.Data.Converters
{
  public static class TypeConverter
  {
    public static RaceAnnouncer.Schema.Models.Game Convert(
      this SRLApiClient.Endpoints.Games.Game game)
       => new Schema.Models.Game(
            game.Abbreviation
            , game.Name
            , game.Id);

    public static RaceAnnouncer.Schema.Models.Race Convert(
      this SRLApiClient.Endpoints.Races.Race race
      , RaceAnnouncer.Schema.Models.Game game)
      => new Schema.Models.Race(
            game
            , race.Goal
            , race.Id
            , race.Time
            , race.State != SRLApiClient.Endpoints.RaceState.Over
            , race.State);

    public static RaceAnnouncer.Schema.Models.Entrant Convert(
      this SRLApiClient.Endpoints.Races.Entrant entrant
      , RaceAnnouncer.Schema.Models.Race race)
      => new Schema.Models.Entrant(
            race
            , entrant.Name
            , entrant.State
            , entrant.Time
            , entrant.Place);

    public static RaceAnnouncer.Schema.Models.Guild Convert(
      this Discord.WebSocket.SocketGuild guild)
      => new Schema.Models.Guild(
            guild.Id
            , guild.Name);

    public static RaceAnnouncer.Schema.Models.Channel Convert(
      this Discord.WebSocket.SocketTextChannel channel
      , RaceAnnouncer.Schema.Models.Guild guild)
      => new Schema.Models.Channel(
            guild,
            channel.Id,
            channel.Name);

    public static RaceAnnouncer.Schema.Models.Announcement Convert(
      this Discord.Rest.RestUserMessage message
      , RaceAnnouncer.Schema.Models.Tracker tracker
      , RaceAnnouncer.Schema.Models.Race race
      , RaceAnnouncer.Schema.Models.Channel channel)
      => new Schema.Models.Announcement(
            channel
            , tracker
            , race,
            message.Id);
  }
}
