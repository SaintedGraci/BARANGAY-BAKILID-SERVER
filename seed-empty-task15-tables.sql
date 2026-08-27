-- Emergency seed script for empty TASK15 tables
-- Run this if permissions, role_permissions, system_settings, or feature_flags are empty

-- ==========================================================================
-- 1. SEED PERMISSIONS (if empty)
-- ==========================================================================

INSERT IGNORE INTO permissions (`key`, label, module, description) VALUES
-- Dashboard
('dashboard.view', 'View Dashboard', 'Dashboard', 'Access to main dashboard'),
('dashboard.analytics', 'View Analytics', 'Dashboard', 'View analytics and statistics'),
('dashboard.reports', 'View Reports', 'Dashboard', 'Access reporting features'),

-- Residents
('residents.view', 'View Residents', 'Residents', 'View resident list and profiles'),
('residents.details', 'View Resident Details', 'Residents', 'View detailed resident information'),
('residents.verify', 'Verify Residents', 'Residents', 'Verify resident accounts'),
('residents.reject', 'Reject Residents', 'Residents', 'Reject resident verifications'),
('residents.suspend', 'Suspend Residents', 'Residents', 'Suspend resident accounts'),
('residents.delete', 'Delete Residents', 'Residents', 'Delete resident accounts'),

-- Requests
('requests.view', 'View Requests', 'Requests', 'View document requests'),
('requests.approve', 'Approve Requests', 'Requests', 'Approve document requests'),
('requests.reject', 'Reject Requests', 'Requests', 'Reject document requests'),
('requests.process', 'Process Requests', 'Requests', 'Process and update requests'),
('requests.complete', 'Mark as Completed', 'Requests', 'Mark requests as completed'),
('requests.download', 'Download Documents', 'Requests', 'Download request documents'),
('requests.generate', 'Generate Documents', 'Requests', 'Generate official documents'),

-- Complaints
('complaints.view', 'View Complaints', 'Complaints', 'View filed complaints'),
('complaints.assign', 'Assign Complaints', 'Complaints', 'Assign complaints to staff'),
('complaints.update', 'Update Complaint Status', 'Complaints', 'Update complaint status'),
('complaints.resolve', 'Resolve Complaints', 'Complaints', 'Mark complaints as resolved'),

-- Announcements
('announcements.view', 'View Announcements', 'Announcements', 'View all announcements'),
('announcements.create', 'Create Announcements', 'Announcements', 'Create new announcements'),
('announcements.edit', 'Edit Announcements', 'Announcements', 'Edit existing announcements'),
('announcements.delete', 'Delete Announcements', 'Announcements', 'Delete announcements'),
('announcements.publish', 'Publish Announcements', 'Announcements', 'Publish announcements'),

-- User Management
('users.view', 'View Users', 'User Management', 'View admin user accounts'),
('users.create', 'Create Users', 'User Management', 'Create new admin accounts'),
('users.edit', 'Edit Users', 'User Management', 'Edit admin user accounts'),
('users.deactivate', 'Deactivate Users', 'User Management', 'Deactivate admin accounts'),
('users.reset', 'Reset User Access', 'User Management', 'Reset passwords and access'),

-- Reports
('reports.view', 'View Reports', 'Reports', 'View system reports'),
('reports.generate', 'Generate Reports', 'Reports', 'Generate custom reports'),
('reports.export', 'Export Reports', 'Reports', 'Export reports to files'),

-- Logs
('logs.view', 'View System Logs', 'System Logs', 'View audit and system logs'),
('logs.export', 'Export Logs', 'System Logs', 'Export log files');

-- ==========================================================================
-- 2. SEED ROLE PERMISSIONS (if empty)
-- ==========================================================================

-- Captain permissions (full access)
INSERT IGNORE INTO role_permissions (role, permissionKey, granted) VALUES
('captain', 'dashboard.view', TRUE),
('captain', 'dashboard.analytics', TRUE),
('captain', 'dashboard.reports', TRUE),
('captain', 'residents.view', TRUE),
('captain', 'residents.details', TRUE),
('captain', 'residents.verify', TRUE),
('captain', 'residents.reject', TRUE),
('captain', 'residents.suspend', TRUE),
('captain', 'requests.view', TRUE),
('captain', 'requests.approve', TRUE),
('captain', 'requests.reject', TRUE),
('captain', 'requests.process', TRUE),
('captain', 'requests.complete', TRUE),
('captain', 'requests.download', TRUE),
('captain', 'requests.generate', TRUE),
('captain', 'complaints.view', TRUE),
('captain', 'complaints.assign', TRUE),
('captain', 'complaints.update', TRUE),
('captain', 'complaints.resolve', TRUE),
('captain', 'announcements.view', TRUE),
('captain', 'announcements.create', TRUE),
('captain', 'announcements.edit', TRUE),
('captain', 'announcements.delete', TRUE),
('captain', 'announcements.publish', TRUE),
('captain', 'users.view', TRUE),
('captain', 'users.create', TRUE),
('captain', 'users.edit', TRUE),
('captain', 'users.deactivate', TRUE),
('captain', 'reports.view', TRUE),
('captain', 'reports.generate', TRUE),
('captain', 'reports.export', TRUE),
('captain', 'logs.view', TRUE),
('captain', 'logs.export', TRUE);

-- Secretary permissions
INSERT IGNORE INTO role_permissions (role, permissionKey, granted) VALUES
('secretary', 'dashboard.view', TRUE),
('secretary', 'dashboard.analytics', TRUE),
('secretary', 'residents.view', TRUE),
('secretary', 'residents.details', TRUE),
('secretary', 'residents.verify', TRUE),
('secretary', 'residents.reject', TRUE),
('secretary', 'requests.view', TRUE),
('secretary', 'requests.approve', TRUE),
('secretary', 'requests.reject', TRUE),
('secretary', 'requests.process', TRUE),
('secretary', 'requests.complete', TRUE),
('secretary', 'requests.download', TRUE),
('secretary', 'requests.generate', TRUE),
('secretary', 'complaints.view', TRUE),
('secretary', 'complaints.assign', TRUE),
('secretary', 'complaints.update', TRUE),
('secretary', 'announcements.view', TRUE),
('secretary', 'announcements.create', TRUE),
('secretary', 'announcements.edit', TRUE),
('secretary', 'announcements.publish', TRUE),
('secretary', 'users.view', TRUE),
('secretary', 'reports.view', TRUE),
('secretary', 'reports.generate', TRUE);

-- Staff permissions
INSERT IGNORE INTO role_permissions (role, permissionKey, granted) VALUES
('staff', 'dashboard.view', TRUE),
('staff', 'residents.view', TRUE),
('staff', 'residents.details', TRUE),
('staff', 'requests.view', TRUE),
('staff', 'requests.process', TRUE),
('staff', 'requests.download', TRUE),
('staff', 'complaints.view', TRUE),
('staff', 'complaints.update', TRUE),
('staff', 'announcements.view', TRUE),
('staff', 'reports.view', TRUE);

-- ==========================================================================
-- 3. SEED SYSTEM SETTINGS (if empty)
-- ==========================================================================

INSERT IGNORE INTO system_settings (`key`, value, type, label, category, description) VALUES
-- Barangay Information
('barangay_name', 'Barangay Bakilid', 'string', 'Barangay Name', 'barangay', 'Official barangay name'),
('municipality', 'Mandaue City', 'string', 'Municipality/City', 'barangay', 'Municipality or city'),
('province', 'Cebu', 'string', 'Province', 'barangay', 'Province name'),
('barangay_email', 'barangaybakilid@mandaue.gov.ph', 'string', 'Official Email', 'barangay', 'Official contact email'),
('barangay_contact', '(032) 123-4567', 'string', 'Contact Number', 'barangay', 'Official contact number'),
('office_address', 'Bakilid, Mandaue City, Cebu', 'string', 'Office Address', 'barangay', 'Physical office address'),
('office_hours', 'Monday - Friday, 8:00 AM - 5:00 PM', 'string', 'Office Hours', 'barangay', 'Operating hours'),

-- Request Settings
('default_processing_days', '3', 'number', 'Default Processing Days', 'request', 'Default processing time for requests'),
('max_pending_requests', '5', 'number', 'Max Pending Requests', 'request', 'Maximum pending requests per resident'),
('request_expiration_days', '30', 'number', 'Request Expiration (Days)', 'request', 'Days before unclaimed requests expire'),
('allow_request_cancellation', 'true', 'boolean', 'Allow Request Cancellation', 'request', 'Residents can cancel pending requests'),

-- Resident Account Settings
('registration_enabled', 'true', 'boolean', 'Registration Enabled', 'resident', 'Allow new resident registration'),
('account_verification_required', 'true', 'boolean', 'Account Verification Required', 'resident', 'New accounts require admin verification'),
('pending_account_expiration_days', '30', 'number', 'Pending Account Expiration', 'resident', 'Days before unverified accounts expire'),
('min_password_length', '8', 'number', 'Minimum Password Length', 'resident', 'Minimum characters for passwords'),
('session_timeout_minutes', '60', 'number', 'Session Timeout (Minutes)', 'resident', 'Auto-logout after inactivity'),

-- Notification Settings
('email_notifications_enabled', 'true', 'boolean', 'Email Notifications', 'notification', 'Send email notifications'),
('notify_on_request_status', 'true', 'boolean', 'Request Status Notifications', 'notification', 'Notify residents on request status changes'),
('notify_on_new_announcement', 'true', 'boolean', 'New Announcement Notifications', 'notification', 'Notify residents of new announcements'),

-- Security Settings
('max_login_attempts', '5', 'number', 'Max Login Attempts', 'security', 'Failed attempts before account lockout'),
('account_lockout_minutes', '15', 'number', 'Account Lockout Duration', 'security', 'Minutes account is locked after max attempts'),
('require_captcha', 'true', 'boolean', 'Require CAPTCHA', 'security', 'Require CAPTCHA on login and registration'),
('rate_limit_per_minute', '100', 'number', 'API Rate Limit', 'security', 'Max API requests per minute per IP');

-- ==========================================================================
-- 4. SEED FEATURE FLAGS (if empty)
-- ==========================================================================

INSERT IGNORE INTO feature_flags (`key`, label, description, isEnabled) VALUES
('online_requests', 'Online Document Requests', 'Allow residents to request documents online', TRUE),
('complaints_module', 'Complaints System', 'Enable complaint filing and management', TRUE),
('announcements_module', 'Announcements', 'Enable barangay announcements and news', TRUE),
('resident_verification', 'Resident Verification', 'Require admin verification for new accounts', TRUE),
('notifications', 'Notifications System', 'Real-time notifications for users', TRUE),
('reports_analytics', 'Reports & Analytics', 'Advanced reporting and analytics dashboards', TRUE),
('online_payments', 'Online Payments', 'Online payment processing for fees', FALSE),
('digital_delivery', 'Digital Document Delivery', 'Digital delivery of approved documents', FALSE),
('mobile_app', 'Mobile App Integration', 'Mobile app API and features', FALSE);

-- ==========================================================================
-- VERIFICATION
-- ==========================================================================

SELECT 'Permissions' as 'Table', COUNT(*) as 'Count' FROM permissions
UNION ALL
SELECT 'Role Permissions', COUNT(*) FROM role_permissions
UNION ALL
SELECT 'System Settings', COUNT(*) FROM system_settings
UNION ALL
SELECT 'Feature Flags', COUNT(*) FROM feature_flags;
