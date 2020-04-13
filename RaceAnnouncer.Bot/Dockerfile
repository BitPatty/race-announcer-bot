ARG DB_NAME
ARG DB_SERVER
ARG DB_PORT
ARG DB_USER
ARG DB_PASS
ARG DISCORD_TOKEN
ARG UPDATE_INTERVAL

FROM mcr.microsoft.com/dotnet/core/runtime:3.1 AS base
WORKDIR /app

FROM mcr.microsoft.com/dotnet/core/sdk:3.1 AS build
WORKDIR /src
COPY . .
RUN dotnet restore "RaceAnnouncer.Bot/RaceAnnouncer.Bot.csproj"
COPY . .
WORKDIR "/src/RaceAnnouncer.Bot"
RUN dotnet build "RaceAnnouncer.Bot.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "RaceAnnouncer.Bot.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ARG DB_NAME
ARG DB_SERVER
ARG DB_PORT
ARG DB_USER
ARG DB_PASS
ARG DISCORD_TOKEN
ARG UPDATE_INTERVAL
ENV DB_NAME $DB_NAME
ENV DB_SERVER $DB_SERVER
ENV DB_PORT $DB_PORT
ENV DB_USER $DB_USER
ENV DB_PASS $DB_PASS
ENV DISCORD_TOKEN $DISCORD_TOKEN
ENV UPDATE_INTERVAL $UPDATE_INTERVAL

ENTRYPOINT ["dotnet", "RaceAnnouncer.Bot.dll"]
