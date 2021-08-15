#!/bin/bash

# e: Exit if anything fails
# x: Print commands before they are executed
set -ex

# The dirname is where this script is located
DIRNAME=`dirname $0`

# The base directory where the project lies
BASE_DIRECTORY=$1

# Setup the environment
cd $DIRNAME
chmod +x $BASE_DIRECTORY/scripts/setup-test-environment.sh
$BASE_DIRECTORY/scripts/setup-test-environment.sh $BASE_DIRECTORY

# Move to the application 
cd $BASE_DIRECTORY

# Run the tests
npm run test