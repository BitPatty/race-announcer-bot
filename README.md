# Race Announcer Bot

<p align="center">
  <img src="https://github.com/BitPatty/RaceAnnouncerBot/raw/develop/docs/rab_preview.png">
</p>

A speedrun race announcer bot designed for multi-source and multi-destination usage. It currently supports the following data sources:

- [RaceTimeGG](https://racetime.gg/)
- [SpeedRunsLive](https://speedrunslive.com/)

As well as the following platforms for announcements:

- [Discord](https://discord.com/) -> User Guide: [Wiki](https://github.com/BitPatty/RaceAnnouncerBot/wiki/Discord-User-Guide)

## Quickstart (Docker)

To use the prebuilt docker images head over to [Packages](https://github.com/BitPatty?tab=packages&repo_name=RaceAnnouncerBot). The application can be scaled horizontally as long as they're connected to the same database/redis.

### Services

The bot follows a stateless design and and requires the following services to be available on your system:

- A Maria or MySQL database
- Redis >= 5

### Developer Setup

The repository is set up to utilize [VSCode Dev Containers](https://code.visualstudio.com/docs/remote/containers) as well as [GitHub Codespaces](https://github.com/features/codespaces). Set up your environment variables (see `/.devcontainer/workspace.env`) and build the dev container to start coding.

You can start the application in watch mode via `npm run dev`. If you change the database models, make sure to create a migration first via `npm run migration:generate`.

### Environment variables

The following environment variables must be set in order to run the application:

| Name              | Description                                                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| DATABASE_TYPE     | `mariadb` or `mysql`, depending on your installation (defaults to `mysql`)                                                               |
| DATABASE_USER     | The user used to connect to the database                                                                                                 |
| DATABASE_PASSWORD | The password to the database                                                                                                             |
| DATABASE_PORT     | The port of the database (defaults to `3306`)                                                                                            |
| DATABASE_HOST     | The host address or host name of your database                                                                                           |
| DATABASE_NAME     | The name of the database                                                                                                                 |
| REDIS_HOST        | The host address of your Redis instance                                                                                                  |
| REDIS_PORT        | The port on which Redis can be accessed                                                                                                  |
| REDIS_PASSWORD    | The password of your Redis instance                                                                                                      |
| DISCORD_BOT_TOKEN | The access token of your Discord bot (See [Discord Developer Portal](https://discord.com/developers/applications) in the `Bot` section)  |
| DISCORD_CLIENT_ID | The client id of your Discord bot (See [Discord Developer Portal](https://discord.com/developers/applications) in the `OAuth 2` section) |

The following environment variables can be set optionally:

| Name                         | Description                                                                          | Default                         |
| ---------------------------- | ------------------------------------------------------------------------------------ | ------------------------------- |
| RACETIME_BASE_URL            | The base url to racetime.gg                                                          | `https://racetime.gg`           |
| SRL_BASE_URL                 | The base url to SpeedRunsLive                                                        | `https://speedrunslive.com`     |
| SRL_API_BASE_URL             | The base url of the SpeedRunsLive API                                                | `https://api.speedrunslive.com` |
| DISCORD_GLOBAL_ADMINS        | Comma-seperated list of user ids which should be considered bot admins on all guilds | -                               |
| LOG_LEVEL                    | The max log level. Can be `info`, `debug` or `trace`                                 | `debug`                         |
| ANNOUNCEMENT_SYNC_INTERVAL   | The interval for announcement updates in cron format                                 | `5/15 * * * * *`                |
| GAME_SYNC_INTERVAL           | The interval for game database synchronization                                       | `0 0 * * * * `                  |
| WORKER_HEALTH_CHECK_INTERVAL | The interval for worker health checks                                                | `*/10 * * * * *`                |
| ELASTICSEARCH_URL            | The URL to your elasticsearch instance (if any) which logs will be streamed to       | -                               |
| ELASTICSEARCH_INDEX          | The elasticsearch index name                                                         | `race-announcer-bot`            |

## License

```
Copyright 2021 Matteias Collet (https://github.com/BitPatty)

This project and all source files in this repository are
licensed under the GNU Affero General Public License v3
(see LICENSE).
```

<!--[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FBitPatty%2FRaceAnnouncerBot.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2FBitPatty%2FRaceAnnouncerBot?ref=badge_large)-->
