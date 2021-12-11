#!/bin/bash

# e: Exit if anything fails
# x: Print commands before they are executed
set -ex

# The base directory where the project lies
BASE_DIRECTORY=$1

# Override the mariadb configuration to accept
# network connections
cp /app/scripts/configs/mariadb-server.cnf /etc/my.cnf.d/mariadb-server.cnf
cat /etc/my.cnf.d/mariadb-server.cnf

# Setup the mariadb
/usr/bin/mysql_install_db \
  --user=mysql \
  --datadir="/var/lib/mysql" \
  --auth-root-authentication-method=normal \
  --port=3306 \
  --verbose

# Helper function to log the mysql setup log in the console
function mysql_log_and_die {
  for f in `find /var/lib/mysql -name "*.err" -type f`; do
    echo "$f"
    cat $f
  done
  exit 1
}


function redis_log_and_die {
  echo "Redis healthcheck failed"
  exit 1
}

# Wait for the database to be ready for connections (up to 60 seconds)
/usr/bin/mysqld_safe --datadir="/var/lib/mysql" --port=3306 &
chmod +x $BASE_DIRECTORY/scripts/wait-for-it.sh
sh $BASE_DIRECTORY/scripts/wait-for-it.sh 127.0.0.1:3306 -t 60 || mysql_log_and_die

# Wait for redis to be ready for connections (up to 60 seconds)
# echo "requirepass devel" >> /etc/redis.conf
redis-server --requirepass devel &
sh $BASE_DIRECTORY/scripts/wait-for-it.sh 127.0.0.1:6379 -t 60 || redis_log_and_die

# Run the initialization script for creating a new user
mysql < $BASE_DIRECTORY/.devcontainer/init.sql

# Copy the test environment variables
cp $BASE_DIRECTORY/scripts/configs/test.env $BASE_DIRECTORY/.env

# Override the database name to ensure the
# setup works with databases that are not called 'development'
export DATABASE_NAME=testing
