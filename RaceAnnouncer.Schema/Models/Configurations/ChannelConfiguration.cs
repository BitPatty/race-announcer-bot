using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RaceAnnouncer.Schema.Models.BaseModels.Configurations;

namespace RaceAnnouncer.Schema.Models.Configurations
{
  public class ChannelConfiguration : DiscordEntityConfiguration<Channel>
  {
    public override void Configure(EntityTypeBuilder<Channel> builder)
    {
      builder.Property(p => p.IsActive).HasDefaultValue(true);

      base.Configure(builder);
    }
  }
}
