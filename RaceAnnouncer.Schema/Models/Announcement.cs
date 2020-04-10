using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using RaceAnnouncer.Schema.Models.BaseModels;

namespace RaceAnnouncer.Schema.Models
{
  [Table("t_announcement")]
  public class Announcement : DiscordEntity
  {
#pragma warning disable CS8618 // Non-nullable field is uninitialized. Consider declaring as nullable.
    protected Announcement() { }
#pragma warning restore CS8618 // Non-nullable field is uninitialized. Consider declaring as nullable.

    public Announcement(Channel channel, Tracker tracker, Race race, ulong snowflake)
    {
      Channel = channel;
      ChannelId = channel.Id;

      Tracker = tracker;
      TrackerId = tracker.Id;

      Race = race;
      RaceId = race.Id;

      Snowflake = snowflake;
    }

    /// <summary>
    /// The channel id in which the announcement was posted
    /// </summary>
    [Required]
    [Column("fk_t_disc_channel")]
    public long ChannelId { get; internal set; }

    /// <summary>
    /// The tracker id associated with this announcement
    /// </summary>
    [Required]
    [Column("fk_t_tracker")]
    public long TrackerId { get; internal set; }

    /// <summary>
    /// The race id associated with this announcement
    /// </summary>
    [Required]
    [Column("fk_t_race")]
    public long RaceId { get; internal set; }

    /// <summary>
    /// Timestamp of when the message was created
    /// </summary>
    [Required]
    [Column("msg_created_at")]
    public DateTime MessageCreatedAt { get; set; }

    /// <summary>
    /// Timestamp of when the message was last updated
    /// </summary>
    [Required]
    [Column("msg_updated_at")]
    public DateTime MessageUpdatedAt { get; set; }

    /// <summary>
    /// The race associated with this announcement
    /// </summary>
    [Required]
    [ForeignKey(nameof(RaceId))]
    [JsonIgnore]
    public Race Race { get; set; }

    /// <summary>
    /// The tracker associated with this announcement
    /// </summary>
    [Required]
    [ForeignKey(nameof(TrackerId))]
    [JsonIgnore]
    public Tracker Tracker { get; set; }

    /// <summary>
    /// The channel in which the announcement was posted
    /// </summary>
    [Required]
    [ForeignKey(nameof(ChannelId))]
    [JsonIgnore]
    public Channel Channel { get; set; }
  }
}
