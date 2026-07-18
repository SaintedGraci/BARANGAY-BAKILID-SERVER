import sequelize from './config/db.js';

async function addVerificationColumns() {
    try {
        console.log('🔄 Adding verification columns to Residents table...');
        
        const QueryInterface = sequelize.getQueryInterface();
        const tableInfo = await QueryInterface.describeTable('Residents');
        
        // Add validIdPath column if it doesn't exist
        if (!tableInfo.validIdPath) {
            await sequelize.query(`
                ALTER TABLE Residents 
                ADD COLUMN validIdPath VARCHAR(255) NULL
            `);
            console.log('✅ Added validIdPath column');
        } else {
            console.log('✓ validIdPath column already exists');
        }
        
        // Add proofOfResidencyPath column if it doesn't exist
        if (!tableInfo.proofOfResidencyPath) {
            await sequelize.query(`
                ALTER TABLE Residents 
                ADD COLUMN proofOfResidencyPath VARCHAR(255) NULL
            `);
            console.log('✅ Added proofOfResidencyPath column');
        } else {
            console.log('✓ proofOfResidencyPath column already exists');
        }
        
        // Add verificationStatus column if it doesn't exist
        if (!tableInfo.verificationStatus) {
            await sequelize.query(`
                ALTER TABLE Residents 
                ADD COLUMN verificationStatus ENUM('pending', 'verified', 'rejected') DEFAULT 'pending'
            `);
            console.log('✅ Added verificationStatus column');
        } else {
            console.log('✓ verificationStatus column already exists');
        }
        
        console.log('✅ All verification columns processed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding columns:', error);
        process.exit(1);
    }
}

addVerificationColumns();
