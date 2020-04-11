# RaceAnnouncerBot

![MySQL (latest)](<https://github.com/BitPatty/RaceAnnouncerBot/workflows/MySQL%20(latest)/badge.svg>)
![MySQL 5.7](https://github.com/BitPatty/RaceAnnouncerBot/workflows/MySQL%205.7/badge.svg)
![MySQL 8.0](https://github.com/BitPatty/RaceAnnouncerBot/workflows/MySQL%208.0/badge.svg)

A **work in progress** rewrite of the SRL race announcer bot for Discord, originally written in NodeJS.

## Requirements

The bot requires a valid MySQL Database connection supplied via environment variables as well as a discord bot token.

## Using docker-compose

Create an `.env` file in the root of the project based on the `.env.example` file and run `docker-compose up` to spin up the bot and api containers.

### Preview

<p align="center">
  <img src="https://github.com/BitPatty/RaceAnnouncerBot/raw/master/preview.png" />
</p>

### Dependencies

Dependencies are available via NuGet.

- [Discord.NET](https://github.com/discord-net/Discord.Net) (MIT)
- [SRLApiClient](https://github.com/BitPatty/SRLApiClient) (AGPL)
- [Pomelo.EntityFrameworkCore.MySql](https://github.com/PomeloFoundation/Pomelo.EntityFrameworkCore.MySql) (MIT)
- [dotnet-env](https://github.com/tonerdo/dotnet-env) (MIT)
- [EntityFrameworkCore](https://github.com/dotnet/efcore) (Apache-2.0)

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
