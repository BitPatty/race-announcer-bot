using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using RaceAnnouncer.Schema.Models.BaseModels;

namespace RaceAnnouncer.Schema.Models
{
  [Table("t_update")]
  public class Update : BaseEntity
  {
    protected Update() { }

    public Update(DateTime startTime, DateTime endTime, bool success)
    {
      StartedAt = startTime;
      FinishedAt = endTime;
      Success = success;
    }

    [Required]
    [Column("started_at")]
    public DateTime StartedAt { get; set; }

    [Required]
    [Column("finished_at")]
    public DateTime FinishedAt { get; set; }

    [Required]
    [Column("success")]
    public bool Success { get; set; }
  }
}
