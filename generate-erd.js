import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ERD Generator Script
 * Generates Entity-Relationship Diagram in Mermaid format
 * Analyzes database schema and models to create visual ERD
 */

// Database Schema Structure
const schema = {
  tables: {
    Users: {
      columns: [
        { name: 'id', type: 'INT', key: 'PK', autoIncrement: true },
        { name: 'fullName', type: 'VARCHAR(255)', nullable: true },
        { name: 'username', type: 'VARCHAR(255)', key: 'UQ', nullable: false },
        { name: 'email', type: 'VARCHAR(255)', key: 'UQ', nullable: false },
        { name: 'password', type: 'VARCHAR(255)', nullable: false },
        { name: 'contactNumber', type: 'VARCHAR(20)', nullable: true },
        { name: 'role', type: "ENUM('resident','staff','secretary','captain','admin')", nullable: false },
        { name: 'status', type: "ENUM('active','inactive')", nullable: false },
        { name: 'isVerified', type: 'BOOLEAN', nullable: false },
        { name: 'createdAt', type: 'DATETIME', nullable: false },
        { name: 'updatedAt', type: 'DATETIME', nullable: false }
      ],
      relationships: []
    },
    
    Residents: {
      columns: [
        { name: 'id', type: 'INT', key: 'PK', autoIncrement: true },
        { name: 'UserId', type: 'INT', key: 'FK', nullable: false },
        { name: 'firstName', type: 'VARCHAR(255)', nullable: false },
        { name: 'middleName', type: 'VARCHAR(255)', nullable: true },
        { name: 'lastName', type: 'VARCHAR(255)', nullable: false },
        { name: 'gender', type: "ENUM('Male','Female')", nullable: true },
        { name: 'birthDate', type: 'DATE', nullable: true },
        { name: 'contactNumber', type: 'VARCHAR(255)', nullable: true },
        { name: 'purok', type: 'VARCHAR(255)', nullable: true },
        { name: 'address', type: 'VARCHAR(255)', nullable: true },
        { name: 'citizenship', type: 'VARCHAR(255)', nullable: true },
        { name: 'validIdPath', type: 'VARCHAR(255)', nullable: true },
        { name: 'proofOfResidencyPath', type: 'VARCHAR(255)', nullable: true },
        { name: 'verificationStatus', type: "ENUM('pending','verified','rejected')", nullable: false },
        { name: 'createdAt', type: 'DATETIME', nullable: false },
        { name: 'updatedAt', type: 'DATETIME', nullable: false }
      ],
      relationships: [
        { type: 'belongsTo', table: 'Users', foreignKey: 'UserId', onDelete: 'CASCADE' }
      ]
    },
    
    Requests: {
      columns: [
        { name: 'id', type: 'INT', key: 'PK', autoIncrement: true },
        { name: 'ResidentId', type: 'INT', key: 'FK', nullable: false },
        { name: 'documentType', type: 'ENUM(documents)', nullable: false },
        { name: 'purpose', type: 'VARCHAR(255)', nullable: false },
        { name: 'status', type: "ENUM('Pending','Processing','Ready for Release','Claimed','Rejected')", nullable: false },
        { name: 'remarks', type: 'TEXT', nullable: true },
        { name: 'releaseDate', type: 'DATE', nullable: true },
        { name: 'createdAt', type: 'DATETIME', nullable: false },
        { name: 'updatedAt', type: 'DATETIME', nullable: false }
      ],
      relationships: [
        { type: 'belongsTo', table: 'Residents', foreignKey: 'ResidentId', onDelete: 'CASCADE' }
      ]
    },
    
    Complaints: {
      columns: [
        { name: 'id', type: 'INT', key: 'PK', autoIncrement: true },
        { name: 'ResidentId', type: 'INT', key: 'FK', nullable: false },
        { name: 'subject', type: 'VARCHAR(255)', nullable: false },
        { name: 'description', type: 'TEXT', nullable: false },
        { name: 'status', type: "ENUM('Pending','Investigating','Resolved')", nullable: false },
        { name: 'createdAt', type: 'DATETIME', nullable: false },
        { name: 'updatedAt', type: 'DATETIME', nullable: false }
      ],
      relationships: [
        { type: 'belongsTo', table: 'Residents', foreignKey: 'ResidentId', onDelete: 'CASCADE' }
      ]
    },
    
    Officials: {
      columns: [
        { name: 'id', type: 'INT', key: 'PK', autoIncrement: true },
        { name: 'firstName', type: 'VARCHAR(255)', nullable: false },
        { name: 'middleName', type: 'VARCHAR(255)', nullable: true },
        { name: 'lastName', type: 'VARCHAR(255)', nullable: false },
        { name: 'position', type: 'ENUM(positions)', nullable: false },
        { name: 'contactNumber', type: 'VARCHAR(255)', nullable: true },
        { name: 'termStart', type: 'DATE', nullable: true },
        { name: 'termEnd', type: 'DATE', nullable: true },
        { name: 'isActive', type: 'BOOLEAN', nullable: false },
        { name: 'createdAt', type: 'DATETIME', nullable: false },
        { name: 'updatedAt', type: 'DATETIME', nullable: false }
      ],
      relationships: []
    },
    
    Announcements: {
      columns: [
        { name: 'id', type: 'INT', key: 'PK', autoIncrement: true },
        { name: 'title', type: 'VARCHAR(255)', nullable: false },
        { name: 'description', type: 'TEXT', nullable: false },
        { name: 'status', type: "ENUM('Active','Inactive','Archived')", nullable: false },
        { name: 'priority', type: "ENUM('Low','Medium','High','Urgent')", nullable: false },
        { name: 'expiryDate', type: 'DATE', nullable: true },
        { name: 'imagePath', type: 'VARCHAR(255)', nullable: true },
        { name: 'thumbnailUrl', type: 'VARCHAR(255)', nullable: true },
        { name: 'mediumUrl', type: 'VARCHAR(255)', nullable: true },
        { name: 'largeUrl', type: 'VARCHAR(255)', nullable: true },
        { name: 'isPinned', type: 'BOOLEAN', nullable: false },
        { name: 'category', type: "ENUM('General','Emergency','Important','Events','Advisories')", nullable: false },
        { name: 'createdAt', type: 'DATETIME', nullable: false },
        { name: 'updatedAt', type: 'DATETIME', nullable: false }
      ],
      relationships: []
    },
    
    AnnouncementReactions: {
      columns: [
        { name: 'id', type: 'INT', key: 'PK', autoIncrement: true },
        { name: 'announcementId', type: 'INT', key: 'FK', nullable: false },
        { name: 'userId', type: 'INT', key: 'FK', nullable: false },
        { name: 'type', type: "ENUM('helpful','like')", nullable: false },
        { name: 'createdAt', type: 'DATETIME', nullable: false },
        { name: 'updatedAt', type: 'DATETIME', nullable: false }
      ],
      relationships: [
        { type: 'belongsTo', table: 'Announcements', foreignKey: 'announcementId', onDelete: 'CASCADE' },
        { type: 'belongsTo', table: 'Users', foreignKey: 'userId', onDelete: 'CASCADE' }
      ]
    },
    
    AnnouncementComments: {
      columns: [
        { name: 'id', type: 'INT', key: 'PK', autoIncrement: true },
        { name: 'announcementId', type: 'INT', key: 'FK', nullable: false },
        { name: 'userId', type: 'INT', key: 'FK', nullable: false },
        { name: 'comment', type: 'TEXT', nullable: false },
        { name: 'createdAt', type: 'DATETIME', nullable: false },
        { name: 'updatedAt', type: 'DATETIME', nullable: false }
      ],
      relationships: [
        { type: 'belongsTo', table: 'Announcements', foreignKey: 'announcementId', onDelete: 'CASCADE' },
        { type: 'belongsTo', table: 'Users', foreignKey: 'userId', onDelete: 'CASCADE' }
      ]
    },
    
    Notifications: {
      columns: [
        { name: 'id', type: 'INT', key: 'PK', autoIncrement: true },
        { name: 'UserId', type: 'INT', key: 'FK', nullable: false },
        { name: 'type', type: 'VARCHAR(255)', nullable: false },
        { name: 'title', type: 'VARCHAR(255)', nullable: false },
        { name: 'message', type: 'TEXT', nullable: false },
        { name: 'data', type: 'JSON', nullable: true },
        { name: 'read', type: 'BOOLEAN', nullable: false },
        { name: 'createdAt', type: 'DATETIME', nullable: false },
        { name: 'updatedAt', type: 'DATETIME', nullable: false }
      ],
      relationships: [
        { type: 'belongsTo', table: 'Users', foreignKey: 'UserId', onDelete: 'CASCADE' }
      ]
    },
    
    refresh_tokens: {
      columns: [
        { name: 'id', type: 'INT', key: 'PK', autoIncrement: true },
        { name: 'token', type: 'VARCHAR(512)', key: 'UQ', nullable: false },
        { name: 'UserId', type: 'INT', key: 'FK', nullable: false },
        { name: 'expiresAt', type: 'DATETIME', nullable: false },
        { name: 'createdAt', type: 'DATETIME', nullable: false },
        { name: 'updatedAt', type: 'DATETIME', nullable: false }
      ],
      relationships: [
        { type: 'belongsTo', table: 'Users', foreignKey: 'UserId', onDelete: 'CASCADE' }
      ]
    },
    
    revoked_tokens: {
      columns: [
        { name: 'id', type: 'INT', key: 'PK', autoIncrement: true },
        { name: 'token', type: 'TEXT', nullable: false },
        { name: 'tokenType', type: "ENUM('access','refresh')", nullable: false },
        { name: 'expiresAt', type: 'DATETIME', nullable: false },
        { name: 'createdAt', type: 'DATETIME', nullable: false },
        { name: 'updatedAt', type: 'DATETIME', nullable: false }
      ],
      relationships: []
    },
    
    images: {
      columns: [
        { name: 'id', type: 'INT', key: 'PK', autoIncrement: true },
        { name: 'original_name', type: 'VARCHAR(255)', nullable: false },
        { name: 'r2_key', type: 'VARCHAR(255)', key: 'UQ', nullable: false },
        { name: 'url', type: 'VARCHAR(255)', nullable: false },
        { name: 'width', type: 'INT', nullable: true },
        { name: 'height', type: 'INT', nullable: true },
        { name: 'size', type: 'INT', nullable: false },
        { name: 'mimetype', type: 'VARCHAR(255)', nullable: false },
        { name: 'category', type: 'VARCHAR(255)', nullable: true },
        { name: 'related_type', type: 'VARCHAR(255)', nullable: true },
        { name: 'related_id', type: 'INT', nullable: true },
        { name: 'uploaded_by', type: 'INT', nullable: true },
        { name: 'is_deleted', type: 'BOOLEAN', nullable: false },
        { name: 'createdAt', type: 'DATETIME', nullable: false },
        { name: 'updatedAt', type: 'DATETIME', nullable: false }
      ],
      relationships: []
    }
  }
};

/**
 * Generate Mermaid ERD syntax
 */
function generateMermaidERD() {
  let mermaid = 'erDiagram\n\n';
  
  // Add tables and their columns
  for (const [tableName, table] of Object.entries(schema.tables)) {
    mermaid += `  ${tableName} {\n`;
    
    for (const col of table.columns) {
      const keyIndicator = col.key ? ` ${col.key}` : '';
      const nullable = col.nullable === false ? ' "NOT NULL"' : '';
      mermaid += `    ${col.type} ${col.name}${keyIndicator}${nullable}\n`;
    }
    
    mermaid += `  }\n\n`;
  }
  
  // Add relationships
  for (const [tableName, table] of Object.entries(schema.tables)) {
    for (const rel of table.relationships) {
      // Determine cardinality
      const cardinality = '||--o{'; // One to Many
      mermaid += `  ${rel.table} ${cardinality} ${tableName} : "has"\n`;
    }
  }
  
  return mermaid;
}

/**
 * Generate Markdown documentation
 */
function generateMarkdownDoc() {
  let markdown = `# Database Entity-Relationship Diagram (ERD)

## Barangay Bakilid System Database Structure

**Generated:** ${new Date().toLocaleString()}  
**Database:** barangay_system  
**Total Tables:** ${Object.keys(schema.tables).length}

---

## Visual ERD

\`\`\`mermaid
${generateMermaidERD().trim()}
\`\`\`

---

## Table Definitions

`;

  // Add detailed table information
  for (const [tableName, table] of Object.entries(schema.tables)) {
    markdown += `### ${tableName}\n\n`;
    
    // Column table
    markdown += `| Column | Type | Key | Nullable | Description |\n`;
    markdown += `|--------|------|-----|----------|-------------|\n`;
    
    for (const col of table.columns) {
      const key = col.key || '-';
      const nullable = col.nullable === false ? 'NO' : 'YES';
      markdown += `| ${col.name} | ${col.type} | ${key} | ${nullable} | |\n`;
    }
    
    markdown += '\n';
    
    // Relationships
    if (table.relationships.length > 0) {
      markdown += `**Relationships:**\n\n`;
      for (const rel of table.relationships) {
        markdown += `- \`${rel.foreignKey}\` → \`${rel.table}\` (${rel.onDelete})\n`;
      }
      markdown += '\n';
    }
    
    markdown += '---\n\n';
  }
  
  // Add key legend
  markdown += `## Key Legend

- **PK** - Primary Key
- **FK** - Foreign Key
- **UQ** - Unique Key

## Relationship Types

- **One-to-One:** \`||\`\`--\`\`||\`
- **One-to-Many:** \`||\`\`--o{\`
- **Many-to-Many:** \`}o\`\`--o{\`

## Notes

1. All tables use **InnoDB** engine for transaction support and foreign key constraints
2. All tables use **utf8mb4** character set for full Unicode support
3. Timestamps (\`createdAt\`, \`updatedAt\`) are automatically managed
4. Soft deletes are implemented where applicable (e.g., images table)

---

**Generated by:** ERD Generator Script  
**Location:** \`barangay_server/generate-erd.js\`
`;

  return markdown;
}

/**
 * Generate JSON schema
 */
function generateJSONSchema() {
  return JSON.stringify(schema, null, 2);
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Generating Entity-Relationship Diagram...\n');
  
  // Generate Mermaid ERD
  const mermaidERD = generateMermaidERD();
  const mermaidPath = path.join(__dirname, '..', 'DATABASE_ERD.mmd');
  fs.writeFileSync(mermaidPath, mermaidERD);
  console.log(`✅ Mermaid ERD saved to: ${mermaidPath}`);
  
  // Generate Markdown Documentation
  const markdownDoc = generateMarkdownDoc();
  const markdownPath = path.join(__dirname, '..', 'DATABASE_ERD.md');
  fs.writeFileSync(markdownPath, markdownDoc);
  console.log(`✅ Markdown documentation saved to: ${markdownPath}`);
  
  // Generate JSON Schema
  const jsonSchema = generateJSONSchema();
  const jsonPath = path.join(__dirname, '..', 'DATABASE_SCHEMA.json');
  fs.writeFileSync(jsonPath, jsonSchema);
  console.log(`✅ JSON schema saved to: ${jsonPath}`);
  
  console.log('\n📊 ERD Generation Complete!\n');
  console.log('📝 Files generated:');
  console.log('   1. DATABASE_ERD.mmd - Mermaid diagram source');
  console.log('   2. DATABASE_ERD.md - Full documentation with visual ERD');
  console.log('   3. DATABASE_SCHEMA.json - Machine-readable schema\n');
  console.log('💡 To view the Mermaid diagram:');
  console.log('   - Use https://mermaid.live/');
  console.log('   - Or install a Mermaid viewer extension in your IDE\n');
}

// Run the generator
main();
