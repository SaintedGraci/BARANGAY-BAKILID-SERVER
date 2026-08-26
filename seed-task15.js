/**
 * Task 15 - Seed Data Script
 * Manually seeds all Task 15 tables with default data
 */

import sequelize from './config/db.js';
import Permission from './models/permission.js';
import RolePermission from './models/rolePermission.js';
import DocumentService from './models/documentService.js';
import SystemSetting from './models/systemSetting.js';
import FeatureFlag from './models/featureFlag.js';

const seedTask15Data = async () => {
  console.log('\n🌱 SEEDING TASK 15 DATA\n');
  console.log('='.repeat(60));
  
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');
    
    // Seed Permissions
    console.log('📝 Seeding Permissions...');
    const defaultPermissions = [
      // Dashboard
      { key: 'dashboard.view', label: 'View Dashboard', module: 'Dashboard', description: 'Access to main dashboard' },
      { key: 'dashboard.analytics', label: 'View Analytics', module: 'Dashboard', description: 'View analytics and statistics' },
      { key: 'dashboard.reports', label: 'View Reports', module: 'Dashboard', description: 'Access reporting features' },
      
      // Residents
      { key: 'residents.view', label: 'View Residents', module: 'Residents', description: 'View resident list and profiles' },
      { key: 'residents.details', label: 'View Resident Details', module: 'Residents', description: 'View detailed resident information' },
      { key: 'residents.verify', label: 'Verify Residents', module: 'Residents', description: 'Verify resident accounts' },
      { key: 'residents.reject', label: 'Reject Residents', module: 'Residents', description: 'Reject resident verifications' },
      { key: 'residents.suspend', label: 'Suspend Residents', module: 'Residents', description: 'Suspend resident accounts' },
      { key: 'residents.delete', label: 'Delete Residents', module: 'Residents', description: 'Delete resident accounts' },
      
      // Requests
      { key: 'requests.view', label: 'View Requests', module: 'Requests', description: 'View document requests' },
      { key: 'requests.approve', label: 'Approve Requests', module: 'Requests', description: 'Approve document requests' },
      { key: 'requests.reject', label: 'Reject Requests', module: 'Requests', description: 'Reject document requests' },
      { key: 'requests.process', label: 'Process Requests', module: 'Requests', description: 'Process and update requests' },
      { key: 'requests.complete', label: 'Mark as Completed', module: 'Requests', description: 'Mark requests as completed' },
      { key: 'requests.download', label: 'Download Documents', module: 'Requests', description: 'Download request documents' },
      { key: 'requests.generate', label: 'Generate Documents', module: 'Requests', description: 'Generate official documents' },
      
      // Complaints
      { key: 'complaints.view', label: 'View Complaints', module: 'Complaints', description: 'View filed complaints' },
      { key: 'complaints.assign', label: 'Assign Complaints', module: 'Complaints', description: 'Assign complaints to staff' },
      { key: 'complaints.update', label: 'Update Complaint Status', module: 'Complaints', description: 'Update complaint status' },
      { key: 'complaints.resolve', label: 'Resolve Complaints', module: 'Complaints', description: 'Mark complaints as resolved' },
      
      // Announcements
      { key: 'announcements.view', label: 'View Announcements', module: 'Announcements', description: 'View all announcements' },
      { key: 'announcements.create', label: 'Create Announcements', module: 'Announcements', description: 'Create new announcements' },
      { key: 'announcements.edit', label: 'Edit Announcements', module: 'Announcements', description: 'Edit existing announcements' },
      { key: 'announcements.delete', label: 'Delete Announcements', module: 'Announcements', description: 'Delete announcements' },
      { key: 'announcements.publish', label: 'Publish Announcements', module: 'Announcements', description: 'Publish announcements' },
      
      // User Management
      { key: 'users.view', label: 'View Users', module: 'User Management', description: 'View admin user accounts' },
      { key: 'users.create', label: 'Create Users', module: 'User Management', description: 'Create new admin accounts' },
      { key: 'users.edit', label: 'Edit Users', module: 'User Management', description: 'Edit admin user accounts' },
      { key: 'users.deactivate', label: 'Deactivate Users', module: 'User Management', description: 'Deactivate admin accounts' },
      { key: 'users.reset', label: 'Reset User Access', module: 'User Management', description: 'Reset passwords and access' },
      
      // Reports
      { key: 'reports.view', label: 'View Reports', module: 'Reports', description: 'View system reports' },
      { key: 'reports.generate', label: 'Generate Reports', module: 'Reports', description: 'Generate custom reports' },
      { key: 'reports.export', label: 'Export Reports', module: 'Reports', description: 'Export reports to files' },
      
      // Logs
      { key: 'logs.view', label: 'View System Logs', module: 'System Logs', description: 'View audit and system logs' },
      { key: 'logs.export', label: 'Export Logs', module: 'System Logs', description: 'Export log files' }
    ];

    await Permission.bulkCreate(defaultPermissions, { ignoreDuplicates: true });
    console.log(`✅ Seeded ${defaultPermissions.length} permissions`);

    // Seed Role Permissions
    console.log('\n📝 Seeding Role Permissions...');
    const rolePermissions = {
      captain: [
        'dashboard.view', 'dashboard.analytics', 'dashboard.reports',
        'residents.view', 'residents.details', 'residents.verify', 'residents.reject', 'residents.suspend',
        'requests.view', 'requests.approve', 'requests.reject', 'requests.process', 'requests.complete', 'requests.download', 'requests.generate',
        'complaints.view', 'complaints.assign', 'complaints.update', 'complaints.resolve',
        'announcements.view', 'announcements.create', 'announcements.edit', 'announcements.delete', 'announcements.publish',
        'users.view', 'users.create', 'users.edit', 'users.deactivate',
        'reports.view', 'reports.generate', 'reports.export',
        'logs.view', 'logs.export'
      ],
      secretary: [
        'dashboard.view', 'dashboard.analytics',
        'residents.view', 'residents.details', 'residents.verify', 'residents.reject',
        'requests.view', 'requests.approve', 'requests.reject', 'requests.process', 'requests.complete', 'requests.download', 'requests.generate',
        'complaints.view', 'complaints.assign', 'complaints.update',
        'announcements.view', 'announcements.create', 'announcements.edit', 'announcements.publish',
        'users.view',
        'reports.view', 'reports.generate'
      ],
      staff: [
        'dashboard.view',
        'residents.view', 'residents.details',
        'requests.view', 'requests.process', 'requests.download',
        'complaints.view', 'complaints.update',
        'announcements.view',
        'reports.view'
      ]
    };

    let totalRolePerms = 0;
    for (const [role, permissions] of Object.entries(rolePermissions)) {
      const rolePermsData = permissions.map(permKey => ({
        role,
        permissionKey: permKey,
        granted: true,
      }));
      await RolePermission.bulkCreate(rolePermsData, { ignoreDuplicates: true });
      totalRolePerms += permissions.length;
    }
    console.log(`✅ Seeded ${totalRolePerms} role permissions`);

    // Seed Document Services
    console.log('\n📝 Seeding Document Services...');
    const defaultServices = [
      { name: 'Barangay Clearance', description: 'Barangay clearance certificate for various purposes', category: 'Certificates', processingFee: 50.00, processingDays: 2, priority: 1 },
      { name: 'Certificate of Residency', description: 'Certificate proving residency in the barangay', category: 'Certificates', processingFee: 30.00, processingDays: 1, priority: 2 },
      { name: 'Certificate of Indigency', description: 'Certificate for indigent residents', category: 'Certificates', processingFee: 0.00, isFree: true, processingDays: 2, priority: 3 },
      { name: 'Business Clearance', description: 'Clearance for business permit application', category: 'Business', processingFee: 100.00, processingDays: 3, priority: 4 },
      { name: 'Barangay ID', description: 'Official barangay identification card', category: 'ID', processingFee: 50.00, processingDays: 5, priority: 5 },
      { name: 'Community Tax Certificate (Cedula)', description: 'Community tax certificate', category: 'Certificates', processingFee: 20.00, processingDays: 1, priority: 6 },
      { name: 'Certificate of Good Moral Character', description: 'Character certificate for employment or school', category: 'Certificates', processingFee: 30.00, processingDays: 2, priority: 7 },
      { name: 'Travel Permit', description: 'Permit for travel purposes (if required)', category: 'Permits', processingFee: 0.00, isFree: true, processingDays: 1, priority: 8 },
      { name: 'Guardianship Certificate', description: 'Certificate of guardianship', category: 'Certificates', processingFee: 50.00, processingDays: 3, priority: 9 },
      { name: 'First Time Job Seeker Certificate', description: 'Certificate for first-time job seekers', category: 'Certificates', processingFee: 0.00, isFree: true, processingDays: 1, priority: 10 }
    ];

    await DocumentService.bulkCreate(defaultServices, { ignoreDuplicates: true });
    console.log(`✅ Seeded ${defaultServices.length} document services`);

    // Seed System Settings
    console.log('\n📝 Seeding System Settings...');
    const defaultSettings = [
      // Barangay Information
      { key: 'barangay_name', value: 'Barangay Bakilid', type: 'string', label: 'Barangay Name', category: 'barangay', description: 'Official barangay name' },
      { key: 'municipality', value: 'Mandaue City', type: 'string', label: 'Municipality/City', category: 'barangay', description: 'Municipality or city' },
      { key: 'province', value: 'Cebu', type: 'string', label: 'Province', category: 'barangay', description: 'Province name' },
      { key: 'barangay_email', value: 'barangaybakilid@mandaue.gov.ph', type: 'string', label: 'Official Email', category: 'barangay', description: 'Official contact email' },
      { key: 'barangay_contact', value: '(032) 123-4567', type: 'string', label: 'Contact Number', category: 'barangay', description: 'Official contact number' },
      { key: 'office_address', value: 'Bakilid, Mandaue City, Cebu', type: 'string', label: 'Office Address', category: 'barangay', description: 'Physical office address' },
      { key: 'office_hours', value: 'Monday - Friday, 8:00 AM - 5:00 PM', type: 'string', label: 'Office Hours', category: 'barangay', description: 'Operating hours' },
      
      // Request Settings
      { key: 'default_processing_days', value: '3', type: 'number', label: 'Default Processing Days', category: 'request', description: 'Default processing time for requests' },
      { key: 'max_pending_requests', value: '5', type: 'number', label: 'Max Pending Requests', category: 'request', description: 'Maximum pending requests per resident' },
      { key: 'request_expiration_days', value: '30', type: 'number', label: 'Request Expiration (Days)', category: 'request', description: 'Days before unclaimed requests expire' },
      { key: 'allow_request_cancellation', value: 'true', type: 'boolean', label: 'Allow Request Cancellation', category: 'request', description: 'Residents can cancel pending requests' },
      
      // Resident Account Settings
      { key: 'registration_enabled', value: 'true', type: 'boolean', label: 'Registration Enabled', category: 'resident', description: 'Allow new resident registration' },
      { key: 'account_verification_required', value: 'true', type: 'boolean', label: 'Account Verification Required', category: 'resident', description: 'New accounts require admin verification' },
      { key: 'pending_account_expiration_days', value: '30', type: 'number', label: 'Pending Account Expiration', category: 'resident', description: 'Days before unverified accounts expire' },
      { key: 'min_password_length', value: '8', type: 'number', label: 'Minimum Password Length', category: 'resident', description: 'Minimum characters for passwords' },
      { key: 'session_timeout_minutes', value: '60', type: 'number', label: 'Session Timeout (Minutes)', category: 'resident', description: 'Auto-logout after inactivity' },
      
      // Notification Settings
      { key: 'email_notifications_enabled', value: 'true', type: 'boolean', label: 'Email Notifications', category: 'notification', description: 'Send email notifications' },
      { key: 'notify_on_request_status', value: 'true', type: 'boolean', label: 'Request Status Notifications', category: 'notification', description: 'Notify residents on request status changes' },
      { key: 'notify_on_new_announcement', value: 'true', type: 'boolean', label: 'New Announcement Notifications', category: 'notification', description: 'Notify residents of new announcements' },
      
      // Security Settings
      { key: 'max_login_attempts', value: '5', type: 'number', label: 'Max Login Attempts', category: 'security', description: 'Failed attempts before account lockout' },
      { key: 'account_lockout_minutes', value: '15', type: 'number', label: 'Account Lockout Duration', category: 'security', description: 'Minutes account is locked after max attempts' },
      { key: 'require_captcha', value: 'true', type: 'boolean', label: 'Require CAPTCHA', category: 'security', description: 'Require CAPTCHA on login and registration' }
    ];

    await SystemSetting.bulkCreate(defaultSettings, { ignoreDuplicates: true });
    console.log(`✅ Seeded ${defaultSettings.length} system settings`);

    // Seed Feature Flags
    console.log('\n📝 Seeding Feature Flags...');
    const defaultFeatures = [
      { key: 'online_requests', label: 'Online Document Requests', description: 'Allow residents to request documents online', isEnabled: true },
      { key: 'complaints_module', label: 'Complaints System', description: 'Enable complaint filing and management', isEnabled: true },
      { key: 'announcements_module', label: 'Announcements', description: 'Enable barangay announcements and news', isEnabled: true },
      { key: 'resident_verification', label: 'Resident Verification', description: 'Require admin verification for new accounts', isEnabled: true },
      { key: 'notifications', label: 'Notifications System', description: 'Real-time notifications for users', isEnabled: true },
      { key: 'reports_analytics', label: 'Reports & Analytics', description: 'Advanced reporting and analytics dashboards', isEnabled: true },
      { key: 'online_payments', label: 'Online Payments', description: 'Online payment processing for fees', isEnabled: false },
      { key: 'digital_delivery', label: 'Digital Document Delivery', description: 'Digital delivery of approved documents', isEnabled: false },
      { key: 'mobile_app', label: 'Mobile App Integration', description: 'Mobile app API and features', isEnabled: false }
    ];

    await FeatureFlag.bulkCreate(defaultFeatures, { ignoreDuplicates: true });
    console.log(`✅ Seeded ${defaultFeatures.length} feature flags`);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 SEEDING COMPLETE!\n');
    console.log('Task 15 tables are now populated with default data.');
    console.log('Run "node test-task15.js" to verify the data.');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ SEEDING ERROR:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

seedTask15Data();
