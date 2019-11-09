using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using RaceAnnouncer.Schema.Models.BaseModels;

namespace RaceAnnouncer.Schema.Models
{
  [Table("t_disc_guild")]
  public class Guild : DiscordEntity
  {
#pragma warning disable CS8618 // Non-nullable field is uninitialized. Consider declaring as nullable.
    protected Guild() { }
#pragma warning restore CS8618 // Non-nullable field is uninitialized. Consider declaring as nullable.

    public Guild(ulong snowflake, string name)
    {
      Snowflake = snowflake;
      DisplayName = name;
    }

    /// <summary>
    /// The guilds display name
    /// </summary>
    [Required(AllowEmptyStrings = false)]
    [MaxLength(128)]
    [Column("display_name")]
    public string DisplayName { get; set; }

    /// <summary>
    /// True if the guild is available
    /// </summary>
    [Required]
    [Column("is_active")]
    public bool IsActive { get; set; }

    /// <summary>
    /// Channels associated with this Guild
    /// </summary>
    public ICollection<Channel> Channels { get; set; } = null!;
  }
}
