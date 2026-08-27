import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
    logging: console.log
  }
);

async function addGmailColumn() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    // Check if gmail column exists
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
      AND TABLE_NAME = 'Residents' 
      AND COLUMN_NAME = 'gmail'
    `);

    if (columns.length > 0) {
      console.log('✓ Gmail column already exists');
      return;
    }

    console.log('Adding gmail column to Residents table...');

    // Add gmail column with unique constraint
    await sequelize.query(`
      ALTER TABLE Residents 
      ADD COLUMN gmail VARCHAR(255) NULL UNIQUE
      AFTER contactNumber
    `);

    console.log('✓ Gmail column added successfully');

    // Verify the column was added
    const [newColumns] = await sequelize.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
      AND TABLE_NAME = 'Residents' 
      AND COLUMN_NAME = 'gmail'
    `);

    if (newColumns.length > 0) {
      console.log('✓ Verification successful:', newColumns[0]);
    }

  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run migration
addGmailColumn()
  .then(() => {
    console.log('\n✅ Gmail column migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
