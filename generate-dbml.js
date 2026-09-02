import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * DBML Generator for dbdiagram.io
 * Generates Database Markup Language from schema
 */

function generateDBML() {
  let dbml = `// Barangay Bakilid System Database
// Generated: ${new Date().toLocaleString()}
// Use at: https://dbdiagram.io/

Project barangay_system {
  database_type: 'MySQL'
  Note: 'Barangay Management System Database Schema'
}

`;

  // Users Table
  dbml += `Table Users {
  id int [pk, increment, note: 'Primary key']
  fullName varchar(255) [null]
  username varchar(255) [not null, unique, note: 'Unique username']
  email varchar(255) [not null, unique, note: 'Unique email']
  password varchar(255) [not null, note: 'Hashed password']
  contactNumber varchar(20) [null]
  role enum('resident','staff','secretary','captain','admin') [not null, default: 'resident']
  status enum('active','inactive') [not null, default: 'active']
  isVerified boolean [not null, default: 0]
  createdAt datetime [not null, default: \`now()\`]
  updatedAt datetime [not null, default: \`now()\`]
  
  indexes {
    email
    username
    role
    status
    isVerified
  }
  
  Note: 'Core user authentication and authorization table'
}

`;

  // Residents Table
  dbml += `Table Residents {
  id int [pk, increment]
  UserId int [not null, unique, ref: > Users.id, note: 'One-to-one with Users']
  firstName varchar(255) [not null]
  middleName varchar(255) [null]
  lastName varchar(255) [not null]
  gender enum('Male','Female') [null]
  birthDate date [null]
  contactNumber varchar(255) [null]
  gmail varchar(255) [null, unique, note: 'Optional Gmail for email verification']
  purok varchar(255) [null, note: 'Subdivision/zone']
  address varchar(255) [null]
  citizenship varchar(255) [default: 'Filipino']
  validIdPath varchar(255) [null, note: 'Path to uploaded ID']
  proofOfResidencyPath varchar(255) [null, note: 'Path to residency proof']
  verificationStatus enum('pending','verified','rejected') [not null, default: 'pending']
  createdAt datetime [not null, default: \`now()\`]
  updatedAt datetime [not null, default: \`now()\`]
  
  indexes {
    (firstName, lastName)
    gmail
    purok
    verificationStatus
  }
  
  Note: 'Resident profile and verification information with optional email verification'
}

`;

  // Requests Table
  dbml += `Table Requests {
  id int [pk, increment]
  ResidentId int [not null, ref: > Residents.id, note: 'Foreign key to Residents']
  DocumentServiceId int [not null, ref: > DocumentServices.id, note: 'Foreign key to DocumentServices']
  purpose varchar(255) [not null, note: 'Reason for request']
  status enum('Pending','Processing','Ready for Release','Claimed','Rejected') [not null, default: 'Pending']
  remarks text [null, note: 'Admin notes']
  releaseDate date [null]
  createdAt datetime [not null, default: \`now()\`]
  updatedAt datetime [not null, default: \`now()\`]
  
  indexes {
    status
    DocumentServiceId
    createdAt
  }
  
  Note: 'Document requests from residents using dynamic DocumentServices'
}

`;

  // Complaints Table
  dbml += `Table Complaints {
  id int [pk, increment]
  ResidentId int [not null, ref: > Residents.id]
  subject varchar(255) [not null]
  description text [not null]
  status enum('Pending','Investigating','Resolved') [not null, default: 'Pending']
  createdAt datetime [not null, default: \`now()\`]
  updatedAt datetime [not null, default: \`now()\`]
  
  indexes {
    status
    createdAt
  }
  
  Note: 'Complaints filed by residents'
}

`;

  // Announcements Table
  dbml += `Table Announcements {
  id int [pk, increment]
  title varchar(255) [not null]
  description text [not null]
  status enum('Active','Inactive','Archived') [not null, default: 'Active']
  priority enum('Low','Medium','High','Urgent') [not null, default: 'Medium']
  category enum('General','Emergency','Important','Events','Advisories') [not null, default: 'General']
  expiryDate date [null]
  imagePath varchar(255) [null, note: 'Original image path']
  thumbnailUrl varchar(255) [null, note: 'Optimized thumbnail (400w)']
  mediumUrl varchar(255) [null, note: 'Optimized medium (800w)']
  largeUrl varchar(255) [null, note: 'Optimized large (1200w)']
  isPinned boolean [not null, default: 0]
  createdAt datetime [not null, default: \`now()\`]
  updatedAt datetime [not null, default: \`now()\`]
  
  indexes {
    status
    priority
    createdAt
    isPinned
  }
  
  Note: 'Barangay announcements with image variants'
}

`;

  // AnnouncementReactions Table
  dbml += `Table AnnouncementReactions {
  id int [pk, increment]
  announcementId int [not null, ref: > Announcements.id]
  userId int [not null, ref: > Users.id]
  type enum('helpful','like') [not null, default: 'helpful']
  createdAt datetime [not null, default: \`now()\`]
  updatedAt datetime [not null, default: \`now()\`]
  
  indexes {
    (announcementId, userId) [unique, note: 'One reaction per user per announcement']
  }
  
  Note: 'Reactions (helpful/like) on announcements'
}

`;

  // AnnouncementComments Table
  dbml += `Table AnnouncementComments {
  id int [pk, increment]
  announcementId int [not null, ref: > Announcements.id]
  userId int [not null, ref: > Users.id]
  comment text [not null]
  createdAt datetime [not null, default: \`now()\`]
  updatedAt datetime [not null, default: \`now()\`]
  
  indexes {
    (announcementId, createdAt)
  }
  
  Note: 'Comments on announcements'
}

`;

  // Notifications Table
  dbml += `Table Notifications {
  id int [pk, increment]
  UserId int [not null, ref: > Users.id]
  type varchar(255) [not null, default: 'request_status_update']
  title varchar(255) [not null]
  message text [not null]
  data json [null, note: 'Additional metadata']
  read boolean [not null, default: 0]
  createdAt datetime [not null, default: \`now()\`]
  updatedAt datetime [not null, default: \`now()\`]
  
  indexes {
    (UserId, read)
    createdAt
  }
  
  Note: 'User notifications for system events'
}

`;

  // refresh_tokens Table
  dbml += `Table refresh_tokens {
  id int [pk, increment]
  token varchar(512) [not null, unique]
  UserId int [not null, ref: > Users.id]
  expiresAt datetime [not null]
  createdAt datetime [not null, default: \`now()\`]
  updatedAt datetime [not null, default: \`now()\`]
  
  indexes {
    UserId
    expiresAt
  }
  
  Note: 'JWT refresh tokens for authentication'
}

`;

  // revoked_tokens Table
  dbml += `Table revoked_tokens {
  id int [pk, increment]
  token text [not null]
  tokenType enum('access','refresh') [not null, default: 'access']
  expiresAt datetime [not null]
  createdAt datetime [not null, default: \`now()\`]
  updatedAt datetime [not null, default: \`now()\`]
  
  indexes {
    expiresAt
  }
  
  Note: 'Blacklisted/revoked tokens'
}

`;

  // images Table
  dbml += `Table images {
  id int [pk, increment]
  original_name varchar(255) [not null, note: 'Original filename']
  r2_key varchar(500) [not null, unique, note: 'Cloudflare R2 storage key']
  url varchar(1000) [not null, note: 'Public CDN URL']
  width int [null]
  height int [null]
  size int [not null, note: 'File size in bytes']
  mimetype varchar(50) [not null, default: 'image/webp', note: 'MIME type']
  category varchar(100) [null, note: 'announcements, documents, profiles']
  related_type varchar(100) [null, note: 'Announcement, Resident, Request']
  related_id int [null, note: 'ID of related entity']
  uploaded_by int [null, note: 'User ID who uploaded']
  is_deleted boolean [not null, default: 0]
  created_at datetime [not null, default: \`now()\`]
  updated_at datetime [not null, default: \`now()\`]
  
  indexes {
    r2_key
    category
    (related_type, related_id)
    uploaded_by
    created_at
  }
  
  Note: 'Optimized images stored in Cloudflare R2 (TASK8)'
}

`;

  // permissions Table
  dbml += `Table permissions {
  id int [pk, increment]
  key varchar(100) [not null, unique, note: 'e.g. complaints.view']
  label varchar(255) [not null, note: 'Human-readable label']
  module varchar(100) [not null, note: 'Dashboard, Residents, Requests, etc.']
  description text [null, note: 'Permission description']
  createdAt datetime [not null, default: \`now()\`]
  updatedAt datetime [not null, default: \`now()\`]
  
  indexes {
    key
    module
  }
  
  Note: 'System permissions for RBAC (TASK15)'
}

`;

  // role_permissions Table
  dbml += `Table role_permissions {
  id int [pk, increment]
  role enum('captain','secretary','staff') [not null, note: 'Admin role type']
  permissionKey varchar(100) [not null, note: 'References permissions.key']
  granted boolean [not null, default: 1, note: 'Whether permission is granted']
  createdAt datetime [not null, default: \`now()\`]
  updatedAt datetime [not null, default: \`now()\`]
  
  indexes {
    (role, permissionKey) [unique]
    permissionKey
  }
  
  Note: 'Role-based permissions mapping (TASK15)'
}

`;

  // DocumentServices Table
  dbml += `Table DocumentServices {
  id int [pk, increment]
  name varchar(255) [not null, unique, note: 'Service name']
  description text [null]
  category enum('Certificates','Permits','Clearances','IDs') [not null, default: 'Certificates']
  processingFee decimal(10,2) [not null, default: 0.00]
  isFree boolean [not null, default: 0]
  processingDays int [not null, default: 3, note: 'Expected processing time']
  requirements text [null, note: 'JSON array of requirements']
  isActive boolean [not null, default: 1]
  priority int [not null, default: 0, note: 'Display order']
  createdAt datetime [not null, default: \`now()\`]
  updatedAt datetime [not null, default: \`now()\`]
  
  indexes {
    name
    category
    isActive
    priority
  }
  
  Note: 'Dynamic document services (TASK15)'
}

`;

  // System_settings Table
  dbml += `Table System_settings {
  id int [pk, increment]
  key varchar(100) [not null, unique]
  value text [null]
  type enum('string','number','boolean','json') [not null, default: 'string']
  description text [null]
  category varchar(100) [null, note: 'General, Security, Email, etc.']
  isEditable boolean [not null, default: 1]
  createdAt datetime [not null, default: \`now()\`]
  updatedAt datetime [not null, default: \`now()\`]
  
  indexes {
    key
    category
  }
  
  Note: 'System configuration settings (TASK15)'
}

`;

  // Feature_flags Table
  dbml += `Table Feature_flags {
  id int [pk, increment]
  feature varchar(100) [not null, unique]
  isEnabled boolean [not null, default: 0]
  description text [null]
  createdAt datetime [not null, default: \`now()\`]
  updatedAt datetime [not null, default: \`now()\`]
  
  indexes {
    feature
    isEnabled
  }
  
  Note: 'Feature toggles for system features (TASK15)'
}

`;

  // Audit_logs Table
  dbml += `Table Audit_logs {
  id int [pk, increment]
  UserId int [null, ref: > Users.id, note: 'User who performed action']
  action varchar(100) [not null, note: 'CREATE, UPDATE, DELETE, etc.']
  entity varchar(100) [not null, note: 'Table/entity affected']
  entityId int [null, note: 'ID of affected record']
  changes json [null, note: 'Before/after data']
  ipAddress varchar(45) [null]
  userAgent text [null]
  createdAt datetime [not null, default: \`now()\`]
  
  indexes {
    UserId
    (entity, entityId)
    action
    createdAt
  }
  
  Note: 'System audit trail (TASK15)'
}

`;

  // Add relationship notes
  dbml += `// Relationships Overview
// Core User & Resident Management
// Users -> Residents (One-to-One)
// Residents -> Requests (One-to-Many)
// Residents -> Complaints (One-to-Many)

// Authentication & Authorization
// Users -> refresh_tokens (One-to-Many)
// Users -> Notifications (One-to-Many)

// Announcements & Interactions
// Announcements -> AnnouncementReactions (One-to-Many)
// Announcements -> AnnouncementComments (One-to-Many)
// Users -> AnnouncementReactions (One-to-Many)
// Users -> AnnouncementComments (One-to-Many)

// RBAC & Document Services (TASK15)
// Requests -> DocumentServices (Many-to-One)
// Users -> Audit_logs (One-to-Many)

// Image Management (TASK8)
// Images table stores optimized WebP images in Cloudflare R2
// Linked via related_type and related_id (polymorphic)
`;

  return dbml;
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Generating DBML for dbdiagram.io...\n');
  
  const dbml = generateDBML();
  const outputPath = path.join(__dirname, '..', 'DATABASE_SCHEMA.dbml');
  
  fs.writeFileSync(outputPath, dbml);
  
  console.log(`✅ DBML file created: ${outputPath}\n`);
  console.log('📊 How to use:\n');
  console.log('   1. Go to https://dbdiagram.io/');
  console.log('   2. Click "Go to App"');
  console.log('   3. Copy the contents of DATABASE_SCHEMA.dbml');
  console.log('   4. Paste into the editor');
  console.log('   5. Your ERD will be visualized automatically!\n');
  console.log('💡 Features:');
  console.log('   - Interactive visual editor');
  console.log('   - Export to PNG/PDF/SQL');
  console.log('   - Share diagrams with team');
  console.log('   - Auto-layout relationships\n');
}

main();
