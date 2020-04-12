using System.ComponentModel.DataAnnotations;
using RaceAnnouncer.WebAPI.Validators;
using System.Text.Json.Serialization;
using RaceAnnouncer.WebAPI.Converters;

namespace RaceAnnouncer.WebAPI.Payloads
{
  public class CreateTrackerRequest
  {
    [JsonConverter(typeof(LongConverter))]
    [PositiveInteger]
    [Display(Name = "channelId")]
    public long ChannelId { get; set; }

    [JsonConverter(typeof(LongConverter))]
    [PositiveInteger]
    [Display(Name = "gameId")]
    public long GameId { get; set; }
  }
}
