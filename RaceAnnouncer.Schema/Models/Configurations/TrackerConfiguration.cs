using System;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RaceAnnouncer.Schema.Models.BaseModels.Configurations;
using RaceAnnouncer.Schema.Models.Enumerations;

namespace RaceAnnouncer.Schema.Models.Configurations
{
  public class TrackerConfiguration : BaseEntityConfiguration<Tracker>
  {
    public override void Configure(EntityTypeBuilder<Tracker> builder)
    {
      TrackerState state;

      builder.Property(p => p.State).HasConversion(
        v => v.ToString(),
        v => Enum.TryParse(v, false, out state) ? state : TrackerState.Unknown
      );

      base.Configure(builder);
    }
  }
}
