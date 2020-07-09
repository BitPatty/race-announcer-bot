using Microsoft.EntityFrameworkCore.Migrations;

namespace RaceAnnouncer.Schema.Migrations
{
  public partial class AddConsecutiveUpdateFailureColumn : Migration
  {
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.AddColumn<int>(
          name: "consecutive_update_failures",
          table: "t_race",
          nullable: false,
          defaultValue: 0);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropColumn(
          name: "consecutive_update_failures",
          table: "t_race");
    }
  }
}
