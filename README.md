# RaceAnnouncerBot

[![MySQL (latest)](<https://github.com/BitPatty/RaceAnnouncerBot/workflows/MySQL%20(latest)/badge.svg>)](https://github.com/BitPatty/RaceAnnouncerBot/actions)
[![MySQL 5.7](https://github.com/BitPatty/RaceAnnouncerBot/workflows/MySQL%205.7/badge.svg)](https://github.com/BitPatty/RaceAnnouncerBot/actions)
[![MySQL 8.0](https://github.com/BitPatty/RaceAnnouncerBot/workflows/MySQL%208.0/badge.svg)](https://github.com/BitPatty/RaceAnnouncerBot/actions)

A cross-platform rewrite of the SRL race announcer bot for Discord, originally written in NodeJS.

## Adding the bot to your server

If you want the bot to join your Discord server send me a direct message on Discord (psy#1363). This process is currently not automized.

If you prefer to host your own instance you can find more information on the requirements in the following sections.

## Components

* RaceAnnouncer.Bot: The bot excutable (.NET Core 3.1)
* RaceAnnouncer.Common: Shared logic (Multitarget: .NET Core 3.1, .NET Standard 2.1)
* RaceAnnouncer.Schema: The database models and migrations (.NET Standard 2.1)
* RaceAnnouncer.Tests: NUnit Tests, mostly entity manipulation tests (.NET Core 3.1)
* RaceAnnouncer.WebAPI: A REST API to manipulate the entities (ASP.NET Core 3.1)

## Requirements

To run the project you need the [.NET Core 3.1 runtime](https://dotnet.microsoft.com/download/dotnet-core/3.1) or [Docker](https://www.docker.com/).

### Environment variables

The project requires a valid MySQL Database connection specified through environment variables (see `.env.example`) as well as a discord bot token which you can get from the [Discord Developer Portal](https://discordapp.com/developers).

### Using docker-compose

Create an `.env` file in the root of the project based on the `.env.example` file and run `docker-compose up` or the `compose.ps1` script to spin up the bot and api container. For more information on docker compose visit [https://docs.docker.com/compose/](https://docs.docker.com/compose/).

### Preview

<p align="center">
  <img src="https://github.com/BitPatty/RaceAnnouncerBot/raw/master/preview.png" />
</p>

### Dependencies

All Dependencies are available via NuGet.

#### Common Dependencies
- [Pomelo.EntityFrameworkCore.MySql](https://github.com/PomeloFoundation/Pomelo.EntityFrameworkCore.MySql) (MIT)
- [EntityFrameworkCore](https://github.com/dotnet/efcore) (Apache-2.0)
- [DotNetEnv](https://github.com/tonerdo/dotnet-env) (MIT)

#### Bot Dependencies
- [SRLApiClient](https://github.com/BitPatty/SRLApiClient) (AGPL)
- [Discord.NET](https://github.com/discord-net/Discord.Net) (MIT)

#### WebAPI Dependencies
- [cloudscribe.Web.Pagination](https://github.com/cloudscribe/cloudscribe.Web.Pagination) (Apache-2.0)
- [Swashbuckle.AspNetCore](https://github.com/domaindrivendev/Swashbuckle.AspNetCore) (MIT)
- [Bcrypt.NET](https://github.com/BcryptNet/bcrypt.net) (MIT)

---

## License

```
RaceAnnouncerBot - A Discord race announcer for SpeedRunsLive races
Copyright (C) 2019-2020  Matteias Collet

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
```
