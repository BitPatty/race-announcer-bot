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
    /// The guild displayname
    /// </summary>
    [Required(AllowEmptyStrings = false)]
    [MaxLength(128)]
    [Column("display_name")]
    public string DisplayName { get; set; }

    /// <summary>
    /// The guilds channels
    /// </summary>
    public ICollection<Channel> Channels { get; set; } = null!;
  }
}
