const dotenv = require('dotenv');
const fs = require('fs');
const rimraf = require('rimraf');

rimraf('ormconfig.json', () => {
  const ormConfig = {
    type: process.env.DATABASE_TYPE,
    host: process.env.DATABASE_HOST,
    port: +process.env.DATABASE_PORT,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: ['src/models/entities/*.{view,entity}.{ts,js}'],
    migrations: ['src/migrations/**/*.ts'],
    cli: {
      migrationsDir: 'src/migrations',
    },
  };

  fs.writeFileSync('ormconfig.json', JSON.stringify(ormConfig));
});
