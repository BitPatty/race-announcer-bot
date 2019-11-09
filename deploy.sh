#!/bin/bash
docker stop raceannouncerbot
docker container rm raceannouncerbot
docker image rm raceannouncer

docker build -f RaceAnnouncer.Bot/Dockerfile -t raceannouncer .
docker run -d --name raceannouncerbot --restart always raceannouncer