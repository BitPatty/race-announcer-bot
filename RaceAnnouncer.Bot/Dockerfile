FROM mcr.microsoft.com/dotnet/core/runtime:3.0-buster-slim AS base
WORKDIR /app

FROM mcr.microsoft.com/dotnet/core/sdk:3.0-buster AS build
WORKDIR /src
COPY ["RaceAnnouncer.Bot/RaceAnnouncer.Bot.csproj", "RaceAnnouncer.Bot/"]
COPY ["RaceAnnouncer.Schema/RaceAnnouncer.Schema.csproj", "RaceAnnouncer.Schema/"]
RUN dotnet restore "RaceAnnouncer.Bot/RaceAnnouncer.Bot.csproj"
COPY . .
WORKDIR "/src/RaceAnnouncer.Bot"
RUN dotnet build "RaceAnnouncer.Bot.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "RaceAnnouncer.Bot.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "RaceAnnouncer.Bot.dll"]