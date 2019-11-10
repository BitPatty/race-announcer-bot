using Microsoft.EntityFrameworkCore.Migrations;

namespace RaceAnnouncer.Schema.Migrations
{
    public partial class RenameUpdateEntity : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_Updates",
                table: "Updates");

            migrationBuilder.RenameTable(
                name: "Updates",
                newName: "t_update");

            migrationBuilder.AddPrimaryKey(
                name: "PK_t_update",
                table: "t_update",
                column: "id");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_t_update",
                table: "t_update");

            migrationBuilder.RenameTable(
                name: "t_update",
                newName: "Updates");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Updates",
                table: "Updates",
                column: "id");
        }
    }
}
