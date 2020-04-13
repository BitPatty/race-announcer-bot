using System.ComponentModel.DataAnnotations;
using RaceAnnouncer.WebAPI.Validators;
using System.Text.Json.Serialization;
using RaceAnnouncer.WebAPI.Converters;

namespace RaceAnnouncer.WebAPI.Payloads
{
  /// <summary>
  /// The payload of a create tracker request
  /// </summary>
  public class CreateTrackerRequest
  {
    /// <summary>
    /// The channel id
    /// </summary>
    [JsonConverter(typeof(LongConverter))]
    [PositiveInteger]
    [Display(Name = "channelId")]
    public long ChannelId { get; set; }

    /// <summary>
    /// The game id
    /// </summary>
    [JsonConverter(typeof(LongConverter))]
    [PositiveInteger]
    [Display(Name = "gameId")]
    public long GameId { get; set; }
  }
}
