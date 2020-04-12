using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using RaceAnnouncer.Schema.Models.BaseModels;

namespace RaceAnnouncer.Schema.Models
{
  [Table("t_api_user")]
  public class APIUser : BaseEntity
  {
#pragma warning disable CS8618 // Non-nullable field is uninitialized. Consider declaring as nullable.
    protected APIUser() { }
#pragma warning restore CS8618 // Non-nullable field is uninitialized. Consider declaring as nullable.

    public APIUser(string username, string apiKey)
    {
      if (String.IsNullOrWhiteSpace(username)) throw new ArgumentException("The username may not be null or whitespace");
      if (String.IsNullOrWhiteSpace(apiKey)) throw new ArgumentException("The password may not be null or whitespace");

      Username = username;
      APIKey = apiKey;
    }

    [Required]
    [Column("username")]
    public string Username { get; set; }

    [Required]
    [MaxLength(520)]
    [Column("api_key")]
    [JsonIgnore]
    public string APIKey { get; set; }

    [Column("expires_at")]
    public Nullable<DateTime> ExpiresAt { get; set; }
  }
}
