using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
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
    /// True if the channel is available
    /// </summary>
    [Required]
    [Column("is_active")]
    public bool IsActive { get; set; }

    /// <summary>
    /// The channels guild id
    /// </summary>
    [Required]
    [Column("fk_t_disc_guild")]
    public long GuildId { get; internal set; }

    /// <summary>
    /// The channels guild
    /// </summary>
    [Required]
    [ForeignKey(nameof(GuildId))]
    [JsonIgnore]
    public Guild Guild { get; set; }

    /// <summary>
    /// Trackers associated with this channel
    /// </summary>
    [InverseProperty(nameof(Tracker.Channel))]
    [JsonIgnore]
    public ICollection<Tracker> Trackers { get; set; } = new HashSet<Tracker>();

    /// <summary>
    /// Announcements associated with this channel
    /// </summary>
    [InverseProperty(nameof(Announcement.Channel))]
    [JsonIgnore]
    public ICollection<Announcement> Announcements { get; set; } = new HashSet<Announcement>();
  }
}
