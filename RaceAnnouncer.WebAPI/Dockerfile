ARG DB_NAME
ARG DB_SERVER
ARG DB_PORT
ARG DB_USER
ARG DB_PASS

FROM mcr.microsoft.com/dotnet/core/aspnet:3.1-buster-slim AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/core/sdk:3.1-buster AS build
WORKDIR /src
COPY . .
RUN dotnet restore "RaceAnnouncer.WebAPI/RaceAnnouncer.WebAPI.csproj"
COPY . .
WORKDIR "/src/RaceAnnouncer.WebAPI"
RUN dotnet build "RaceAnnouncer.WebAPI.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "RaceAnnouncer.WebAPI.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ARG DB_NAME
ARG DB_SERVER
ARG DB_PORT
ARG DB_USER
ARG DB_PASS
ENV DB_NAME $DB_NAME
ENV DB_SERVER $DB_SERVER
ENV DB_PORT $DB_PORT
ENV DB_USER $DB_USER
ENV DB_PASS $DB_PASS

ENTRYPOINT ["dotnet", "RaceAnnouncer.WebAPI.dll"]