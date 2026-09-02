import db from './config/db.js';
import logger from './config/logger.js';

/**
 * Verify TASK18 migration was successful
 */

async function verifyMigration() {
  try {
    logger.info('Verifying TASK18 migration...');
    
    const connection = await db.getConnection();
    
    // Check if selfieUrl column exists
    const [selfieColumn] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'Residents' 
        AND COLUMN_NAME = 'selfieUrl'
    `);
    
    // Check if rejectionReason column exists
    const [rejectColumn] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'Residents' 
        AND COLUMN_NAME = 'rejectionReason'
    `);
    
    connection.release();
    
    console.log('\n========================================');
    console.log('TASK18 MIGRATION VERIFICATION');
    console.log('========================================\n');
    
    if (selfieColumn.length > 0) {
      console.log('✅ selfieUrl column exists');
      console.log(`   Type: ${selfieColumn[0].COLUMN_TYPE}`);
      console.log(`   Nullable: ${selfieColumn[0].IS_NULLABLE}`);
      console.log(`   Default: ${selfieColumn[0].COLUMN_DEFAULT || 'NULL'}`);
    } else {
      console.log('❌ selfieUrl column NOT FOUND');
    }
    
    console.log('');
    
    if (rejectColumn.length > 0) {
      console.log('✅ rejectionReason column exists');
      console.log(`   Type: ${rejectColumn[0].COLUMN_TYPE}`);
      console.log(`   Nullable: ${rejectColumn[0].IS_NULLABLE}`);
      console.log(`   Default: ${rejectColumn[0].COLUMN_DEFAULT || 'NULL'}`);
    } else {
      console.log('❌ rejectionReason column NOT FOUND');
    }
    
    console.log('\n========================================');
    
    if (selfieColumn.length > 0 && rejectColumn.length > 0) {
      console.log('✅ MIGRATION SUCCESSFUL!');
      console.log('   Database is ready for TASK18 selfie verification.');
    } else {
      console.log('❌ MIGRATION INCOMPLETE');
      console.log('   Please run: node migrations/add-selfie-verification.js');
    }
    
    console.log('========================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verifyMigration();
