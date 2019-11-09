using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
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
    internal long ChannelId { get; set; }

    /// <summary>
    /// The game id associated with this tracker
    /// </summary>
    [Required]
    [Column("fk_t_game")]
    internal long GameId { get; set; }

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
    public Channel Channel { get; set; }

    /// <summary>
    /// The game associated with this tracker
    /// </summary>
    [Required]
    [ForeignKey(nameof(GameId))]
    public Game Game { get; set; }

    /// <summary>
    /// The announcements associated with this tracker
    /// </summary>
    [InverseProperty(nameof(Announcement.Tracker))]
    public ICollection<Announcement> Announcements { get; set; } = null!;
  }
}
