using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RaceAnnouncer.Schema.Models.BaseModels.Configurations;

namespace RaceAnnouncer.Schema.Models.Configurations
{
  public class APIUserConfiguration : BaseEntityConfiguration<APIUser>
  {
    public override void Configure(EntityTypeBuilder<APIUser> builder)
    {
      builder.HasIndex(p => p.Username).IsUnique();

      base.Configure(builder);
    }
  }
}
