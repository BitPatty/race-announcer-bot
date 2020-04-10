using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using RaceAnnouncer.Schema.Models.BaseModels;
using RaceAnnouncer.Schema.Models.Enumerations;

namespace RaceAnnouncer.Schema.Models
{
  [Table("t_tracker")]
  public class Tracker : BaseEntity
  {
#pragma warning disable CS8618 // Non-nullable field is uninitialized. Consider declaring as nullable.
    protected Tracker() { }
#pragma warning restore CS8618 // Non-nullable field is uninitialized. Consider declaring as nullable.

    public Tracker(Channel channel, Game game)
    {
      Channel = channel;
      ChannelId = channel.Id;

      Game = game;
      GameId = game.Id;

      State = TrackerState.Created;
    }

    /// <summary>
    /// The channel id associated with this tracker
    /// </summary>
    [Required]
    [Column("fk_t_disc_channel")]
    public long ChannelId { get; internal set; }

    /// <summary>
    /// The game id associated with this tracker
    /// </summary>
    [Required]
    [Column("fk_t_game")]
    public long GameId { get; internal set; }

    /// <summary>
    /// The trackers state
    /// </summary>
    [Required]
    [Column("state")]
    public TrackerState State { get; set; }

    /// <summary>
    /// The channel associated with this tracker
    /// </summary>
    [Required]
    [ForeignKey(nameof(ChannelId))]
    [JsonIgnore]
    public Channel Channel { get; set; }

    /// <summary>
    /// The game associated with this tracker
    /// </summary>
    [Required]
    [ForeignKey(nameof(GameId))]
    [JsonIgnore]
    public Game Game { get; set; }

    /// <summary>
    /// The announcements associated with this tracker
    /// </summary>
    [InverseProperty(nameof(Announcement.Tracker))]
    [JsonIgnore]
    public ICollection<Announcement> Announcements { get; set; } = new HashSet<Announcement>();
  }
}
