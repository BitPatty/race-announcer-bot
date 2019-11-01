using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RaceAnnouncer.Schema.Models.BaseModels
{
  public abstract class BaseEntity
  {
    /// <summary>
    /// The entities id
    /// </summary>
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("id")]
    public long Id { get; set; }

    /// <summary>
    /// The entities creation date
    /// </summary>
    [Column("created_at")]
    [Required]
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// The entities last update
    /// </summary>
    [Column("updated_at")]
    [Required]
    public DateTime UpdatedAt { get; set; }
  }
}
