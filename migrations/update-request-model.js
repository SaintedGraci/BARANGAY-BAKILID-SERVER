import sequelize from '../config/db.js';
import { QueryTypes } from 'sequelize';

/**
 * Migration: Update Request Model to use DocumentServiceId
 * - Adds DocumentServiceId foreign key
 * - Changes documentType from ENUM to VARCHAR(255)
 * - Adds new tracking fields
 */

async function migrate() {
  try {
    console.log('🚀 Starting Request model migration...\n');

    // 1. Check if DocumentServiceId column exists
    const columns = await sequelize.query(
      "SHOW COLUMNS FROM `Requests` LIKE 'DocumentServiceId'",
      { type: QueryTypes.SELECT }
    );

    if (columns.length === 0) {
      console.log('➕ Adding DocumentServiceId column...');
      await sequelize.query(`
        ALTER TABLE \`Requests\`
        ADD COLUMN \`DocumentServiceId\` INT NULL AFTER \`id\`
      `);
      console.log('✅ DocumentServiceId column added\n');
    } else {
      console.log('⏭️  DocumentServiceId column already exists\n');
    }

    // 2. Change documentType from ENUM to VARCHAR
    console.log('🔄 Converting documentType from ENUM to VARCHAR(255)...');
    await sequelize.query(`
      ALTER TABLE \`Requests\`
      MODIFY COLUMN \`documentType\` VARCHAR(255) NULL
    `);
    console.log('✅ documentType converted to VARCHAR(255)\n');

    // 3. Add new tracking fields if they don't exist
    const trackingFields = [
      { name: 'requestedDate', type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
      { name: 'processedBy', type: 'INT', default: null },
      { name: 'processingFee', type: 'DECIMAL(10,2)', default: '0.00' },
      { name: 'paymentStatus', type: "ENUM('Unpaid','Paid','Waived')", default: "'Unpaid'" },
    ];

    for (const field of trackingFields) {
      const fieldExists = await sequelize.query(
        `SHOW COLUMNS FROM \`Requests\` LIKE '${field.name}'`,
        { type: QueryTypes.SELECT }
      );

      if (fieldExists.length === 0) {
        console.log(`➕ Adding ${field.name} column...`);
        const defaultClause = field.default ? `DEFAULT ${field.default}` : '';
        await sequelize.query(`
          ALTER TABLE \`Requests\`
          ADD COLUMN \`${field.name}\` ${field.type} ${defaultClause}
        `);
        console.log(`✅ ${field.name} column added\n`);
      } else {
        console.log(`⏭️  ${field.name} column already exists\n`);
      }
    }

    // 4. Migrate existing data - map old documentType to DocumentServiceId
    console.log('🔄 Migrating existing requests to use DocumentServiceId...');
    
    const documentTypeMapping = [
      { oldName: 'Barangay Clearance', newName: 'Barangay Clearance' },
      { oldName: 'Certificate of Residency', newName: 'Certificate of Residency' },
      { oldName: 'Indigency Certificate', newName: 'Certificate of Indigency' },
      { oldName: 'Business Permit', newName: 'Business Clearance' },
      { oldName: 'Certificate of Good Moral', newName: 'Certificate of Good Moral Character' },
      { oldName: 'Community Tax Certificate (Cedula)', newName: 'Community Tax Certificate' },
    ];

    for (const mapping of documentTypeMapping) {
      // Find the DocumentService ID
      const service = await sequelize.query(
        `SELECT id FROM \`DocumentServices\` WHERE \`name\` = ?`,
        { replacements: [mapping.newName], type: QueryTypes.SELECT }
      );

      if (service.length > 0) {
        const serviceId = service[0].id;
        
        // Update requests with this documentType
        await sequelize.query(`
          UPDATE \`Requests\`
          SET \`DocumentServiceId\` = ?
          WHERE \`documentType\` = ? AND \`DocumentServiceId\` IS NULL
        `, { replacements: [serviceId, mapping.oldName] });
        
        console.log(`✅ Migrated "${mapping.oldName}" → DocumentServiceId: ${serviceId}`);
      } else {
        console.log(`⚠️  DocumentService "${mapping.newName}" not found - skipping migration`);
      }
    }

    console.log('');

    // 5. Delete or fix any remaining NULL DocumentServiceIds before making it NOT NULL
    console.log('🔍 Checking for remaining NULL DocumentServiceIds...');
    const nullCount = await sequelize.query(
      `SELECT COUNT(*) as count FROM \`Requests\` WHERE \`DocumentServiceId\` IS NULL`,
      { type: QueryTypes.SELECT }
    );

    if (nullCount[0].count > 0) {
      console.log(`⚠️  Found ${nullCount[0].count} requests with NULL DocumentServiceId`);
      console.log('🗑️  Deleting requests without mapped services...');
      await sequelize.query(`DELETE FROM \`Requests\` WHERE \`DocumentServiceId\` IS NULL`);
      console.log(`✅ Deleted ${nullCount[0].count} unmapped requests\n`);
    } else {
      console.log('✅ No NULL DocumentServiceIds found\n');
    }

    // 6. Make DocumentServiceId NOT NULL after migration
    console.log('🔒 Making DocumentServiceId required (NOT NULL)...');
    await sequelize.query(`
      ALTER TABLE \`Requests\`
      MODIFY COLUMN \`DocumentServiceId\` INT NOT NULL
    `);
    console.log('✅ DocumentServiceId is now required\n');

    // 7. Add foreign key constraint
    console.log('🔗 Adding foreign key constraint...');
    try {
      await sequelize.query(`
        ALTER TABLE \`Requests\`
        ADD CONSTRAINT \`fk_requests_document_service\`
        FOREIGN KEY (\`DocumentServiceId\`) REFERENCES \`DocumentServices\`(\`id\`)
        ON DELETE RESTRICT ON UPDATE CASCADE
      `);
      console.log('✅ Foreign key constraint added\n');
    } catch (error) {
      if (error.message.includes('Duplicate key')) {
        console.log('⏭️  Foreign key constraint already exists\n');
      } else {
        throw error;
      }
    }

    console.log('✨ Migration completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrate()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration error:', error);
    process.exit(1);
  });
