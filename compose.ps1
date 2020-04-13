docker-compose down --rmi all;
docker-compose up -d --build --force-recreate;
docker-compose logs -f;