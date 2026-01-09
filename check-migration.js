const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: 'mysql',
    logging: false,
  }
);

async function checkColumns() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'patients'
      AND COLUMN_NAME IN ('bloodType', 'height', 'weight', 'chronicDiseases', 'allergies')
    `, {
      replacements: [process.env.DB_NAME]
    });

    console.log('\n📊 Health info columns in patients table:');
    if (results.length === 0) {
      console.log('❌ No health info columns found! Migration needs to be run.');
      console.log('\nTo run migration:');
      console.log('  node run-migration.js');
    } else {
      console.log('✅ Found columns:');
      results.forEach((col: any) => {
        console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}, nullable: ${col.IS_NULLABLE})`);
      });
      
      if (results.length < 5) {
        console.log('\n⚠️  Some columns are missing! Run migration to add them.');
      } else {
        console.log('\n✅ All health info columns exist!');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkColumns();
