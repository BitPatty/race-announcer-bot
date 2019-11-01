using System;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RaceAnnouncer.Schema.Models.BaseModels.Configurations;
using SRLApiClient.Endpoints;

namespace RaceAnnouncer.Schema.Models.Configurations
{
  public class RaceConfiguration : BaseEntityConfiguration<Race>
  {
    public override void Configure(EntityTypeBuilder<Race> builder)
    {
      RaceState state;

      builder.Property(p => p.State).HasConversion(
        v => v.ToString(),
        v => Enum.TryParse(v, false, out state) ? state : RaceState.Unknown
      );

      base.Configure(builder);
    }
  }
}
