using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace RaceAnnouncer.Schema.Models.BaseModels.Configurations
{
  public class DiscordEntityConfiguration<T> : BaseEntityConfiguration<T> where T : DiscordEntity
  {
    public override void Configure(EntityTypeBuilder<T> builder)
    {
      builder.HasAlternateKey(p => p.Snowflake);
      base.Configure(builder);
    }
  }
}
