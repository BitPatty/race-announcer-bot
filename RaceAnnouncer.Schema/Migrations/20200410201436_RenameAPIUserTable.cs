using Microsoft.EntityFrameworkCore.Migrations;

namespace RaceAnnouncer.Schema.Migrations
{
    public partial class RenameAPIUserTable : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_APIUser",
                table: "APIUser");

            migrationBuilder.RenameTable(
                name: "APIUser",
                newName: "t_api_user");

            migrationBuilder.RenameIndex(
                name: "IX_APIUser_username",
                table: "t_api_user",
                newName: "IX_t_api_user_username");

            migrationBuilder.AddPrimaryKey(
                name: "PK_t_api_user",
                table: "t_api_user",
                column: "id");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_t_api_user",
                table: "t_api_user");

            migrationBuilder.RenameTable(
                name: "t_api_user",
                newName: "APIUser");

            migrationBuilder.RenameIndex(
                name: "IX_t_api_user_username",
                table: "APIUser",
                newName: "IX_APIUser_username");

            migrationBuilder.AddPrimaryKey(
                name: "PK_APIUser",
                table: "APIUser",
                column: "id");
        }
    }
}
