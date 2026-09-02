import db from '../config/db.js';
import logger from '../config/logger.js';

/**
 * Migration: Add selfie verification support to Residents table
 * Purpose: Enable manual identity verification by admins
 * Date: 2026-09-02
 */

async function addSelfieVerification() {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    logger.info('Starting selfie verification migration...');
    
    // Check if selfieUrl column already exists
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'Residents' 
        AND COLUMN_NAME = 'selfieUrl'
    `);
    
    if (columns.length > 0) {
      logger.info('✓ selfieUrl column already exists, skipping...');
      await connection.commit();
      return;
    }
    
    // Add selfieUrl column after proofOfResidencyPath
    logger.info('Adding selfieUrl column to Residents table...');
    await connection.query(`
      ALTER TABLE Residents 
      ADD COLUMN selfieUrl VARCHAR(255) DEFAULT NULL 
      AFTER proofOfResidencyPath
    `);
    
    logger.info('✓ selfieUrl column added successfully');
    
    // Check if rejectionReason column exists
    const [rejectColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'Residents' 
        AND COLUMN_NAME = 'rejectionReason'
    `);
    
    if (rejectColumns.length === 0) {
      logger.info('Adding rejectionReason column to Residents table...');
      await connection.query(`
        ALTER TABLE Residents 
        ADD COLUMN rejectionReason TEXT DEFAULT NULL 
        AFTER verificationStatus
      `);
      logger.info('✓ rejectionReason column added successfully');
    } else {
      logger.info('✓ rejectionReason column already exists, skipping...');
    }
    
    await connection.commit();
    logger.info('✅ Selfie verification migration completed successfully!');
    
  } catch (error) {
    await connection.rollback();
    logger.error('❌ Migration failed:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addSelfieVerification()
    .then(() => {
      logger.info('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration script failed:', error);
      process.exit(1);
    });
}

export default addSelfieVerification;
