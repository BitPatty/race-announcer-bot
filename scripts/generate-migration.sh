#!/bin/bash
echo  "Enter the name of your migration"
node scripts/generate-orm-config.js
read name
node_modules/.bin/ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:generate -n $name