using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RaceAnnouncer.Schema.Models.BaseModels
{
  public abstract class DiscordEntity : BaseEntity
  {
    /// <summary>
    /// The discord snowflake
    /// </summary>
    [Required]
    [Column("snowflake")]
    public ulong Snowflake { get; set; }
  }
}
