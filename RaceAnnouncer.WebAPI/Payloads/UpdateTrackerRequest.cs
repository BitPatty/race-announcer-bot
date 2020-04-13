using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using RaceAnnouncer.WebAPI.Converters;
using RaceAnnouncer.WebAPI.Validators;

namespace RaceAnnouncer.WebAPI.Payloads
{
  /// <summary>
  /// Payload of an update tracker request
  /// </summary>
  public class UpdateTrackerRequest
  {
    /// <summary>
    /// The new channel id
    /// </summary>
    [JsonConverter(typeof(LongConverter))]
    [PositiveInteger]
    [Display(Name = "channelId")]
    public long ChannelId { get; set; }

    /// <summary>
    /// The new game id
    /// </summary>
    [JsonConverter(typeof(LongConverter))]
    [PositiveInteger]
    [Display(Name = "gameId")]
    public long GameId { get; set; }
  }
}
