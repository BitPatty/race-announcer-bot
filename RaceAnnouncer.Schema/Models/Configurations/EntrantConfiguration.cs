using System;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RaceAnnouncer.Schema.Models.BaseModels.Configurations;
using SRLApiClient.Endpoints;

namespace RaceAnnouncer.Schema.Models.Configurations
{
  public class EntrantConfiguration : BaseEntityConfiguration<Entrant>
  {
    public override void Configure(EntityTypeBuilder<Entrant> builder)
    {
      EntrantState state;

      builder.Property(p => p.State).HasConversion(
        v => v.ToString(),
        v => Enum.TryParse(v, false, out state) ? state : EntrantState.Unknown
      );

      base.Configure(builder);
    }
  }
}
