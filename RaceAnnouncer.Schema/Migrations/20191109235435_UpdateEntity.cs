using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

namespace RaceAnnouncer.Schema.Migrations
{
  public partial class UpdateEntity : Migration
  {
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.CreateTable(
          name: "Updates",
          columns: table => new
          {
            id = table.Column<long>(nullable: false)
                  .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
            created_at = table.Column<DateTime>(nullable: false)
                  .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
            updated_at = table.Column<DateTime>(nullable: false)
                  .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn),
            started_at = table.Column<DateTime>(nullable: false),
            finished_at = table.Column<DateTime>(nullable: false),
            success = table.Column<bool>(nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_Updates", x => x.id);
          });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropTable(
          name: "Updates");
    }
  }
}
