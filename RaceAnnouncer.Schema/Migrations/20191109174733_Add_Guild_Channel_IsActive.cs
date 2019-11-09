using Microsoft.EntityFrameworkCore.Migrations;

namespace RaceAnnouncer.Schema.Migrations
{
    public partial class Add_Guild_Channel_IsActive : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_active",
                table: "t_disc_guild",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_active",
                table: "t_disc_channel",
                nullable: false,
                defaultValue: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "is_active",
                table: "t_disc_guild");

            migrationBuilder.DropColumn(
                name: "is_active",
                table: "t_disc_channel");
        }
    }
}
