using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace RaceAnnouncer.Schema.Models.BaseModels.Configurations
{
  public class BaseEntityConfiguration<T> : IEntityTypeConfiguration<T> where T : BaseEntity
  {
    public virtual void Configure(EntityTypeBuilder<T> builder)
    {
      builder.Property(p => p.CreatedAt).Metadata.SetBeforeSaveBehavior(PropertySaveBehavior.Ignore);
      builder.Property(p => p.UpdatedAt).Metadata.SetBeforeSaveBehavior(PropertySaveBehavior.Ignore);
      builder.Property(p => p.CreatedAt).ValueGeneratedOnAdd();
      builder.Property(p => p.UpdatedAt).ValueGeneratedOnAddOrUpdate();
    }
  }
}
