using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using RaceAnnouncer.WebAPI.Converters;
using RaceAnnouncer.WebAPI.Validators;

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
