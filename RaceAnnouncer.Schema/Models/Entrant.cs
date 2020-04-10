using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using RaceAnnouncer.Schema.Models.BaseModels;
using SRLApiClient.Endpoints;

namespace RaceAnnouncer.Schema.Models
{
  [Table("t_entrant")]
  public class Entrant : BaseEntity
  {
#pragma warning disable CS8618 // Non-nullable field is uninitialized. Consider declaring as nullable.
    protected Entrant() { }
#pragma warning restore CS8618 // Non-nullable field is uninitialized. Consider declaring as nullable.

    public Entrant(Race race, string name, EntrantState state, int? time, int? place)
    {
      RaceId = race.Id;
      Race = race;

      DisplayName = name;
      State = state;
      Time = time;
      Place = place;
    }

    /// <summary>
    /// The entrants display name
    /// </summary>
    [Required]
    [Column("name")]
    public string DisplayName { get; set; }

    /// <summary>
    /// The race id associated with this entrant
    /// </summary>
    [Required]
    [Column("fk_t_race")]
    public long RaceId { get; internal set; }

    /// <summary>
    /// The entrants current state
    /// </summary>
    [Required]
    [Column("state")]
    public EntrantState State { get; set; }

    /// <summary>
    /// The entrants current time
    /// </summary>
    [Column("time")]
    public Nullable<int> Time { get; set; }

    /// <summary>
    /// The entrants current place
    /// </summary>
    [Column("place")]
    public Nullable<int> Place { get; set; }

    /// <summary>
    /// The race associated with this entrant
    /// </summary>
    [Required]
    [ForeignKey(nameof(RaceId))]
    [JsonIgnore]
    public Race Race { get; set; }
  }
}
