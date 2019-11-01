using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using RaceAnnouncer.Schema.Models.BaseModels;

#pragma warning disable CS8618 // Non-nullable field is uninitialized. Consider declaring as nullable.

namespace RaceAnnouncer.Schema.Models
{
  [Table("t_disc_channel")]
  public class Channel : DiscordEntity
  {
#pragma warning disable CS8618 // Non-nullable field is uninitialized. Consider declaring as nullable.
    protected Channel() { }
#pragma warning restore CS8618 // Non-nullable field is uninitialized. Consider declaring as nullable.

    public Channel(Guild guild, ulong snowflake, string name)
    {
      Guild = guild;
      GuildId = guild.Id;

      DisplayName = name;
      Snowflake = snowflake;
    }

    /// <summary>
    /// The channels display name
    /// </summary>
    [Required(AllowEmptyStrings = false)]
    [MaxLength(128)]
    [Column("display_name")]
    public string DisplayName { get; set; }

    /// <summary>
    /// The channels guild id
    /// </summary>
    [Required]
    [Column("fk_guild")]
    protected long GuildId { get; set; }

    /// <summary>
    /// The channels guild
    /// </summary>
    [Required]
    [ForeignKey(nameof(GuildId))]
    public Guild Guild { get; set; }

    public ICollection<Tracker> Trackers { get; set; } = null!;
  }
}
