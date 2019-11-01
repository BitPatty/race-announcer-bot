using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using RaceAnnouncer.Schema.Models.BaseModels;

namespace RaceAnnouncer.Schema.Models
{
  [Table("t_game")]
  public class Game : BaseEntity
  {
#pragma warning disable CS8618 // Non-nullable field is uninitialized. Consider declaring as nullable.
    protected Game() { }
#pragma warning restore CS8618 // Non-nullable field is uninitialized. Consider declaring as nullable.

    public Game(string abbreviation, string name, int srlId)
    {
      Abbreviation = abbreviation;
      Name = name;
      SrlId = srlId;
    }

    /// <summary>
    /// The games srl id
    /// </summary>
    [Required]
    [Column("srl_id")]
    public int SrlId
    {
      get => _srlId;
      set
      {
        if (value < 1) throw new ArgumentException($"({nameof(SrlId)}) Value must be greater than 0: '{SrlId}' given.");
        else _srlId = value;
      }
    }

    private int _srlId { get; set; } = 0!;

    /// <summary>
    /// The games abbreviation
    /// </summary>
    [Required(AllowEmptyStrings = false)]
    [MaxLength(128)]
    [Column("abbreviation")]
    public string Abbreviation
    {
      get => _abbreviation;
      set
      {
        if (String.IsNullOrWhiteSpace(value)) throw new ArgumentException($"({nameof(Abbreviation)}) Invalid game abbreviation: '{Abbreviation}' given.");
        else _abbreviation = value;
      }
    }

    private string _abbreviation { get; set; } = null!;

    /// <summary>
    /// The games name
    /// </summary>
    [Required(AllowEmptyStrings = false)]
    [MaxLength(256)]
    [Column("name")]
    public string Name
    {
      get => _name;
      set
      {
        if (String.IsNullOrWhiteSpace(value)) throw new ArgumentException($"({nameof(Name)}) Invalid game name: '{Name}' given.");
        else _name = value;
      }
    }

    private string _name { get; set; } = null!;
  }
}
