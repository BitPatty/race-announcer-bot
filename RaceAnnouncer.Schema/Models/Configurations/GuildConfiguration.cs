using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RaceAnnouncer.Schema.Models.BaseModels.Configurations;

namespace RaceAnnouncer.Schema.Models.Configurations
{
  public class GuildConfiguration : DiscordEntityConfiguration<Guild>
  {
    [System.Diagnostics.CodeAnalysis.SuppressMessage("Redundancy", "RCS1132:Remove redundant overriding member.", Justification = "Clarity")]
    public override void Configure(EntityTypeBuilder<Guild> builder)
    {
      base.Configure(builder);
    }
  }
}
