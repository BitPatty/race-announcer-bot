using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using RaceAnnouncer.Schema.Models.BaseModels;
using SRLApiClient.Endpoints;

namespace RaceAnnouncer.Schema.Models
{
  [Table("t_race")]
  public class Race : BaseEntity
  {
#pragma warning disable CS8618 // Non-nullable field is uninitialized. Consider declaring as nullable.
    protected Race() { }
#pragma warning restore CS8618 // Non-nullable field is uninitialized. Consider declaring as nullable.

    public Race(Game game, string goal, string srlId, int time, bool isActive, RaceState state)
    {
      Game = game;
      GameId = game.Id;

      Goal = goal;
      SrlId = srlId;
      Time = time;
      IsActive = isActive;
      State = state;
    }

    /// <summary>
    /// The srl id associated with this race
    /// </summary>
    [Required]
    [Column("srl_id")]
    [MaxLength(10)]
    public string SrlId { get; set; }

    /// <summary>
    /// The game id associated with this race
    /// </summary>
    [Required]
    [Column("fk_t_game")]
    internal long GameId { get; set; }

    /// <summary>
    /// The races goal
    /// </summary>
    [Required]
    [Column("goal")]
    [MaxLength(2048)]
    public string Goal { get; set; }

    /// <summary>
    /// The races start/final time
    /// </summary>
    [Required]
    [Column("time")]
    public int Time { get; set; }

    /// <summary>
    /// True if the race is still active on SRL
    /// </summary>
    [Required]
    [Column("is_active")]
    public bool IsActive { get; set; }

    /// <summary>
    /// The races current state
    /// </summary>
    [Required]
    [Column("state")]
    public RaceState State { get; set; }

    /// <summary>
    /// The game associated with this race
    /// </summary>
    [Required]
    [ForeignKey(nameof(GameId))]
    public Game Game { get; set; }

    /// <summary>
    /// The races entrants
    /// </summary>
    [InverseProperty(nameof(Entrant.Race))]
    public ICollection<Entrant> Entrants { get; set; } = null!;

    /// <summary>
    /// Announcements associated with this race
    /// </summary>
    [InverseProperty(nameof(Announcement.Race))]
    public ICollection<Announcement> Announcements { get; set; } = null!;
  }
}
