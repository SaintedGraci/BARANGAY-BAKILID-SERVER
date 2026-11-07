import sequelize from '../config/db.js';
import { DataTypes } from 'sequelize';

/**
 * Migration: Add Archive System to Requests Table
 * 
 * Adds fields for archiving claimed documents:
 * - isArchived: Flag to mark archived requests
 * - claimedDate: When document was claimed
 * - archivedDate: When request was archived
 * - archivedBy: User who archived the request
 */

async function up() {
  const queryInterface = sequelize.getQueryInterface();
  
  console.log('🗄️  Adding archive system fields to Requests table...');
  
  try {
    // Check if columns already exist
    const tableDescription = await queryInterface.describeTable('Requests');
    
    // Add isArchived column
    if (!tableDescription.isArchived) {
      await queryInterface.addColumn('Requests', 'isArchived', {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'True when document is claimed and archived',
      });
      console.log('✅ Added isArchived column');
    } else {
      console.log('ℹ️  isArchived column already exists');
    }
    
    // Add claimedDate column
    if (!tableDescription.claimedDate) {
      await queryInterface.addColumn('Requests', 'claimedDate', {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Date when document was claimed by resident',
      });
      console.log('✅ Added claimedDate column');
    } else {
      console.log('ℹ️  claimedDate column already exists');
    }
    
    // Add archivedDate column
    if (!tableDescription.archivedDate) {
      await queryInterface.addColumn('Requests', 'archivedDate', {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Date when request was moved to archives',
      });
      console.log('✅ Added archivedDate column');
    } else {
      console.log('ℹ️  archivedDate column already exists');
    }
    
    // Add archivedBy column
    if (!tableDescription.archivedBy) {
      await queryInterface.addColumn('Requests', 'archivedBy', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id',
        },
        comment: 'User who archived this request',
      });
      console.log('✅ Added archivedBy column');
    } else {
      console.log('ℹ️  archivedBy column already exists');
    }
    
    // Migrate existing "Claimed" requests
    console.log('\n📦 Migrating existing Claimed requests...');
    const [results] = await sequelize.query(`
      UPDATE Requests 
      SET 
        claimedDate = releaseDate,
        isArchived = false
      WHERE status = 'Claimed' 
        AND claimedDate IS NULL
    `);
    
    console.log(`✅ Updated ${results.affectedRows || 0} claimed requests with claimedDate`);
    
    // Add indexes for performance
    console.log('\n🔍 Adding indexes...');
    
    try {
      await queryInterface.addIndex('Requests', ['isArchived'], {
        name: 'idx_requests_archived',
      });
      console.log('✅ Added index on isArchived');
    } catch (err) {
      if (err.message.includes('already exists') || err.message.includes('Duplicate key name')) {
        console.log('ℹ️  Index on isArchived already exists');
      } else {
        throw err;
      }
    }
    
    try {
      await queryInterface.addIndex('Requests', ['claimedDate'], {
        name: 'idx_requests_claimed_date',
      });
      console.log('✅ Added index on claimedDate');
    } catch (err) {
      if (err.message.includes('already exists') || err.message.includes('Duplicate key name')) {
        console.log('ℹ️  Index on claimedDate already exists');
      } else {
        throw err;
      }
    }
    
    try {
      await queryInterface.addIndex('Requests', ['isArchived', 'status'], {
        name: 'idx_requests_archived_status',
      });
      console.log('✅ Added composite index on isArchived + status');
    } catch (err) {
      if (err.message.includes('already exists') || err.message.includes('Duplicate key name')) {
        console.log('ℹ️  Composite index already exists');
      } else {
        throw err;
      }
    }
    
    console.log('\n✅ Archive system migration completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function down() {
  const queryInterface = sequelize.getQueryInterface();
  
  console.log('🔄 Rolling back archive system migration...');
  
  try {
    // Remove indexes
    await queryInterface.removeIndex('Requests', 'idx_requests_archived');
    await queryInterface.removeIndex('Requests', 'idx_requests_claimed_date');
    await queryInterface.removeIndex('Requests', 'idx_requests_archived_status');
    
    // Remove columns
    await queryInterface.removeColumn('Requests', 'archivedBy');
    await queryInterface.removeColumn('Requests', 'archivedDate');
    await queryInterface.removeColumn('Requests', 'claimedDate');
    await queryInterface.removeColumn('Requests', 'isArchived');
    
    console.log('✅ Rollback completed');
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  up()
    .then(() => {
      console.log('\n🎉 Migration complete!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n💥 Migration failed:', err);
      process.exit(1);
    });
}

export { up, down };
