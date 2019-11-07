using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RaceAnnouncer.Schema.Models.BaseModels.Configurations;

namespace RaceAnnouncer.Schema.Models.Configurations
{
  public class GameConfiguration : BaseEntityConfiguration<Game>
  {
    public override void Configure(EntityTypeBuilder<Game> builder)
    {
      builder.HasAlternateKey(p => p.SrlId);
      builder.HasAlternateKey(p => p.Abbreviation);

      builder.Property(p => p.Abbreviation).HasConversion(
        v => v.ToLower(),
        v => v
      );

      base.Configure(builder);
    }
  }
}
