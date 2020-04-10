using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

namespace RaceAnnouncer.Schema.Migrations
{
  public partial class CreateApiUser : Migration
  {
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.AlterColumn<bool>(
          name: "success",
          table: "t_update",
          nullable: false,
          oldClrType: typeof(ulong),
          oldType: "bit");

      migrationBuilder.AlterColumn<string>(
          name: "state",
          table: "t_tracker",
          nullable: false,
          oldClrType: typeof(string),
          oldType: "longtext");

      migrationBuilder.AlterColumn<string>(
          name: "state",
          table: "t_race",
          nullable: false,
          oldClrType: typeof(string),
          oldType: "longtext");

      migrationBuilder.AlterColumn<string>(
          name: "srl_id",
          table: "t_race",
          maxLength: 10,
          nullable: false,
          oldClrType: typeof(string),
          oldType: "varchar(10)",
          oldMaxLength: 10);

      migrationBuilder.AlterColumn<bool>(
          name: "is_active",
          table: "t_race",
          nullable: false,
          oldClrType: typeof(ulong),
          oldType: "bit");

      migrationBuilder.AlterColumn<string>(
          name: "goal",
          table: "t_race",
          maxLength: 2048,
          nullable: false,
          oldClrType: typeof(string),
          oldType: "longtext",
          oldMaxLength: 2048);

      migrationBuilder.AlterColumn<string>(
          name: "name",
          table: "t_game",
          maxLength: 256,
          nullable: false,
          oldClrType: typeof(string),
          oldType: "varchar(256)",
          oldMaxLength: 256);

      migrationBuilder.AlterColumn<string>(
          name: "abbreviation",
          table: "t_game",
          maxLength: 128,
          nullable: false,
          oldClrType: typeof(string),
          oldType: "varchar(128)",
          oldMaxLength: 128);

      migrationBuilder.AlterColumn<string>(
          name: "state",
          table: "t_entrant",
          nullable: false,
          oldClrType: typeof(string),
          oldType: "longtext");

      migrationBuilder.AlterColumn<string>(
          name: "name",
          table: "t_entrant",
          nullable: false,
          oldClrType: typeof(string),
          oldType: "longtext");

      migrationBuilder.AlterColumn<bool>(
          name: "is_active",
          table: "t_disc_guild",
          nullable: false,
          defaultValue: true,
          oldClrType: typeof(ulong),
          oldType: "bit",
          oldDefaultValue: 1ul);

      migrationBuilder.AlterColumn<string>(
          name: "display_name",
          table: "t_disc_guild",
          maxLength: 128,
          nullable: false,
          oldClrType: typeof(string),
          oldType: "varchar(128)",
          oldMaxLength: 128);

      migrationBuilder.AlterColumn<bool>(
          name: "is_active",
          table: "t_disc_channel",
          nullable: false,
          defaultValue: true,
          oldClrType: typeof(ulong),
          oldType: "bit",
          oldDefaultValue: 1ul);

      migrationBuilder.AlterColumn<string>(
          name: "display_name",
          table: "t_disc_channel",
          maxLength: 128,
          nullable: false,
          oldClrType: typeof(string),
          oldType: "varchar(128)",
          oldMaxLength: 128);

      migrationBuilder.CreateTable(
          name: "APIUser",
          columns: table => new
          {
            id = table.Column<long>(nullable: false)
                  .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
            created_at = table.Column<DateTime>(nullable: false)
                  .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
            updated_at = table.Column<DateTime>(nullable: false)
                  .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn),
            username = table.Column<string>(nullable: false),
            api_key = table.Column<string>(maxLength: 520, nullable: false),
            expires_at = table.Column<DateTime>(nullable: true)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_APIUser", x => x.id);
          });

      migrationBuilder.CreateIndex(
          name: "IX_APIUser_username",
          table: "APIUser",
          column: "username",
          unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropTable(
          name: "APIUser");

      migrationBuilder.AlterColumn<ulong>(
          name: "success",
          table: "t_update",
          type: "bit",
          nullable: false,
          oldClrType: typeof(bool));

      migrationBuilder.AlterColumn<string>(
          name: "state",
          table: "t_tracker",
          type: "longtext",
          nullable: false,
          oldClrType: typeof(string));

      migrationBuilder.AlterColumn<string>(
          name: "state",
          table: "t_race",
          type: "longtext",
          nullable: false,
          oldClrType: typeof(string));

      migrationBuilder.AlterColumn<string>(
          name: "srl_id",
          table: "t_race",
          type: "varchar(10)",
          maxLength: 10,
          nullable: false,
          oldClrType: typeof(string),
          oldMaxLength: 10);

      migrationBuilder.AlterColumn<ulong>(
          name: "is_active",
          table: "t_race",
          type: "bit",
          nullable: false,
          oldClrType: typeof(bool));

      migrationBuilder.AlterColumn<string>(
          name: "goal",
          table: "t_race",
          type: "longtext",
          maxLength: 2048,
          nullable: false,
          oldClrType: typeof(string),
          oldMaxLength: 2048);

      migrationBuilder.AlterColumn<string>(
          name: "name",
          table: "t_game",
          type: "varchar(256)",
          maxLength: 256,
          nullable: false,
          oldClrType: typeof(string),
          oldMaxLength: 256);

      migrationBuilder.AlterColumn<string>(
          name: "abbreviation",
          table: "t_game",
          type: "varchar(128)",
          maxLength: 128,
          nullable: false,
          oldClrType: typeof(string),
          oldMaxLength: 128);

      migrationBuilder.AlterColumn<string>(
          name: "state",
          table: "t_entrant",
          type: "longtext",
          nullable: false,
          oldClrType: typeof(string));

      migrationBuilder.AlterColumn<string>(
          name: "name",
          table: "t_entrant",
          type: "longtext",
          nullable: false,
          oldClrType: typeof(string));

      migrationBuilder.AlterColumn<ulong>(
          name: "is_active",
          table: "t_disc_guild",
          type: "bit",
          nullable: false,
          defaultValue: 1ul,
          oldClrType: typeof(bool),
          oldDefaultValue: true);

      migrationBuilder.AlterColumn<string>(
          name: "display_name",
          table: "t_disc_guild",
          type: "varchar(128)",
          maxLength: 128,
          nullable: false,
          oldClrType: typeof(string),
          oldMaxLength: 128);

      migrationBuilder.AlterColumn<ulong>(
          name: "is_active",
          table: "t_disc_channel",
          type: "bit",
          nullable: false,
          defaultValue: 1ul,
          oldClrType: typeof(bool),
          oldDefaultValue: true);

      migrationBuilder.AlterColumn<string>(
          name: "display_name",
          table: "t_disc_channel",
          type: "varchar(128)",
          maxLength: 128,
          nullable: false,
          oldClrType: typeof(string),
          oldMaxLength: 128);
    }
  }
}
