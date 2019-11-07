using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

namespace RaceAnnouncer.Schema.Migrations
{
    public partial class InitialMigration : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "t_disc_guild",
                columns: table => new
                {
                    id = table.Column<long>(nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    created_at = table.Column<DateTime>(nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    updated_at = table.Column<DateTime>(nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn),
                    snowflake = table.Column<ulong>(nullable: false),
                    display_name = table.Column<string>(maxLength: 128, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_t_disc_guild", x => x.id);
                    table.UniqueConstraint("AK_t_disc_guild_snowflake", x => x.snowflake);
                });

            migrationBuilder.CreateTable(
                name: "t_game",
                columns: table => new
                {
                    id = table.Column<long>(nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    created_at = table.Column<DateTime>(nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    updated_at = table.Column<DateTime>(nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn),
                    srl_id = table.Column<int>(nullable: false),
                    abbreviation = table.Column<string>(maxLength: 128, nullable: false),
                    name = table.Column<string>(maxLength: 256, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_t_game", x => x.id);
                    table.UniqueConstraint("AK_t_game_abbreviation", x => x.abbreviation);
                    table.UniqueConstraint("AK_t_game_srl_id", x => x.srl_id);
                });

            migrationBuilder.CreateTable(
                name: "t_disc_channel",
                columns: table => new
                {
                    id = table.Column<long>(nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    created_at = table.Column<DateTime>(nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    updated_at = table.Column<DateTime>(nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn),
                    snowflake = table.Column<ulong>(nullable: false),
                    display_name = table.Column<string>(maxLength: 128, nullable: false),
                    fk_guild = table.Column<long>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_t_disc_channel", x => x.id);
                    table.UniqueConstraint("AK_t_disc_channel_snowflake", x => x.snowflake);
                    table.ForeignKey(
                        name: "FK_t_disc_channel_t_disc_guild_fk_guild",
                        column: x => x.fk_guild,
                        principalTable: "t_disc_guild",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "t_race",
                columns: table => new
                {
                    id = table.Column<long>(nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    created_at = table.Column<DateTime>(nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    updated_at = table.Column<DateTime>(nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn),
                    srl_id = table.Column<string>(maxLength: 10, nullable: false),
                    fk_t_game = table.Column<long>(nullable: false),
                    goal = table.Column<string>(maxLength: 2048, nullable: false),
                    time = table.Column<int>(nullable: false),
                    is_active = table.Column<bool>(nullable: false),
                    state = table.Column<string>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_t_race", x => x.id);
                    table.ForeignKey(
                        name: "FK_t_race_t_game_fk_t_game",
                        column: x => x.fk_t_game,
                        principalTable: "t_game",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "t_tracker",
                columns: table => new
                {
                    id = table.Column<long>(nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    created_at = table.Column<DateTime>(nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    updated_at = table.Column<DateTime>(nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn),
                    fk_t_channel = table.Column<long>(nullable: false),
                    fk_t_game = table.Column<long>(nullable: false),
                    state = table.Column<string>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_t_tracker", x => x.id);
                    table.ForeignKey(
                        name: "FK_t_tracker_t_disc_channel_fk_t_channel",
                        column: x => x.fk_t_channel,
                        principalTable: "t_disc_channel",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_t_tracker_t_game_fk_t_game",
                        column: x => x.fk_t_game,
                        principalTable: "t_game",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "t_entrant",
                columns: table => new
                {
                    id = table.Column<long>(nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    created_at = table.Column<DateTime>(nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    updated_at = table.Column<DateTime>(nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn),
                    name = table.Column<string>(nullable: false),
                    fk_t_race = table.Column<long>(nullable: false),
                    state = table.Column<string>(nullable: false),
                    time = table.Column<int>(nullable: true),
                    place = table.Column<int>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_t_entrant", x => x.id);
                    table.ForeignKey(
                        name: "FK_t_entrant_t_race_fk_t_race",
                        column: x => x.fk_t_race,
                        principalTable: "t_race",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "t_announcement",
                columns: table => new
                {
                    id = table.Column<long>(nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    created_at = table.Column<DateTime>(nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    updated_at = table.Column<DateTime>(nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn),
                    snowflake = table.Column<ulong>(nullable: false),
                    fk_t_channel = table.Column<long>(nullable: false),
                    fk_t_tracker = table.Column<long>(nullable: false),
                    fk_t_race = table.Column<long>(nullable: false),
                    msg_created_at = table.Column<DateTime>(nullable: false),
                    msg_updated_at = table.Column<DateTime>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_t_announcement", x => x.id);
                    table.UniqueConstraint("AK_t_announcement_snowflake", x => x.snowflake);
                    table.ForeignKey(
                        name: "FK_t_announcement_t_disc_channel_fk_t_channel",
                        column: x => x.fk_t_channel,
                        principalTable: "t_disc_channel",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_t_announcement_t_race_fk_t_race",
                        column: x => x.fk_t_race,
                        principalTable: "t_race",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_t_announcement_t_tracker_fk_t_tracker",
                        column: x => x.fk_t_tracker,
                        principalTable: "t_tracker",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_t_announcement_fk_t_channel",
                table: "t_announcement",
                column: "fk_t_channel");

            migrationBuilder.CreateIndex(
                name: "IX_t_announcement_fk_t_race",
                table: "t_announcement",
                column: "fk_t_race");

            migrationBuilder.CreateIndex(
                name: "IX_t_announcement_fk_t_tracker",
                table: "t_announcement",
                column: "fk_t_tracker");

            migrationBuilder.CreateIndex(
                name: "IX_t_disc_channel_fk_guild",
                table: "t_disc_channel",
                column: "fk_guild");

            migrationBuilder.CreateIndex(
                name: "IX_t_entrant_fk_t_race",
                table: "t_entrant",
                column: "fk_t_race");

            migrationBuilder.CreateIndex(
                name: "IX_t_race_fk_t_game",
                table: "t_race",
                column: "fk_t_game");

            migrationBuilder.CreateIndex(
                name: "IX_t_tracker_fk_t_channel",
                table: "t_tracker",
                column: "fk_t_channel");

            migrationBuilder.CreateIndex(
                name: "IX_t_tracker_fk_t_game",
                table: "t_tracker",
                column: "fk_t_game");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "t_announcement");

            migrationBuilder.DropTable(
                name: "t_entrant");

            migrationBuilder.DropTable(
                name: "t_tracker");

            migrationBuilder.DropTable(
                name: "t_race");

            migrationBuilder.DropTable(
                name: "t_disc_channel");

            migrationBuilder.DropTable(
                name: "t_game");

            migrationBuilder.DropTable(
                name: "t_disc_guild");
        }
    }
}
