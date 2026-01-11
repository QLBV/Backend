const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: 'mysql',
    logging: console.log,
  }
);

async function runMigration() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established.');

    const migrationFile = path.join(__dirname, 'migrations', '20250105000001-add-health-info-to-patients.js');
    const migration = require(migrationFile);

    console.log('Running migration: add-health-info-to-patients');
    const queryInterface = sequelize.getQueryInterface();
    await migration.up(queryInterface, Sequelize);
    
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
