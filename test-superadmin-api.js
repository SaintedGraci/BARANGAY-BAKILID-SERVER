import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let testServiceId = null;

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printTestHeader(title) {
  console.log('\n' + '='.repeat(60));
  log(`📋 ${title}`, 'cyan');
  console.log('='.repeat(60));
}

async function loginAsAdmin() {
  printTestHeader('TEST 1: Admin Login');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@bakilid.gov.ph',
      password: 'admin123',
      turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX' // Test turnstile token
    });
    
    authToken = response.data.token;
    log(`✅ Login successful`, 'green');
    log(`   Token: ${authToken.substring(0, 20)}...`, 'blue');
    log(`   User: ${response.data.user.username} (${response.data.user.role})`, 'blue');
    return true;
  } catch (error) {
    log(`❌ Login failed: ${error.response?.data?.message || error.message}`, 'red');
    if (error.response?.data?.errors) {
      error.response.data.errors.forEach(err => {
        log(`   - ${err.field}: ${err.message}`, 'yellow');
      });
    }
    return false;
  }
}

async function testDashboardStats() {
  printTestHeader('TEST 2: Get Dashboard Statistics');
  try {
    const response = await axios.get(`${BASE_URL}/superadmin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const stats = response.data.data;
    log(`✅ Dashboard stats retrieved`, 'green');
    log(`   Total Users: ${stats.users.total}`, 'blue');
    log(`   Active Users: ${stats.users.active}`, 'blue');
    log(`   Verified Residents: ${stats.residents.verified}`, 'blue');
    log(`   Pending Residents: ${stats.residents.pending}`, 'blue');
    log(`   Document Services: ${stats.documentServices.total}`, 'blue');
    log(`   Pending Requests: ${stats.requests.pending}`, 'blue');
    log(`   System Health: ${JSON.stringify(stats.systemHealth)}`, 'blue');
    return true;
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testGetAllPermissions() {
  printTestHeader('TEST 3: Get All Permissions');
  try {
    const response = await axios.get(`${BASE_URL}/superadmin/permissions`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const permissions = response.data.data.permissions;
    log(`✅ Retrieved ${permissions.length} permissions`, 'green');
    log(`   Modules: ${[...new Set(permissions.map(p => p.module))].join(', ')}`, 'blue');
    
    // Show sample permissions
    permissions.slice(0, 3).forEach(p => {
      log(`   - ${p.module}.${p.key}: ${p.label}`, 'blue');
    });
    return true;
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testGetPermissionMatrix() {
  printTestHeader('TEST 4: Get Permission Matrix');
  try {
    const response = await axios.get(`${BASE_URL}/superadmin/permissions/matrix`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const matrix = response.data.data.permissionMatrix;
    log(`✅ Retrieved permission matrix with ${matrix.length} permissions`, 'green');
    
    // Count permissions per role
    const captainCount = matrix.filter(p => p.captain).length;
    const secretaryCount = matrix.filter(p => p.secretary).length;
    const staffCount = matrix.filter(p => p.staff).length;
    
    log(`   Captain: ${captainCount} permissions`, 'blue');
    log(`   Secretary: ${secretaryCount} permissions`, 'blue');
    log(`   Staff: ${staffCount} permissions`, 'blue');
    return true;
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testGetRolePermissions() {
  printTestHeader('TEST 5: Get Role Permissions (Captain)');
  try {
    const response = await axios.get(`${BASE_URL}/superadmin/permissions/role/captain`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const permissions = response.data.data.permissions;
    log(`✅ Retrieved ${permissions.length} permissions for Captain`, 'green');
    permissions.slice(0, 3).forEach(p => {
      log(`   - ${p.permissionKey} (granted: ${p.granted})`, 'blue');
    });
    return true;
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testUpdateRolePermissions() {
  printTestHeader('TEST 6: Update Role Permissions');
  try {
    // Add a test permission to staff role
    const response = await axios.put(
      `${BASE_URL}/superadmin/permissions/role/staff`,
      {
        permissions: [
          { permissionKey: 'dashboard.view', granted: true },
          { permissionKey: 'residents.view', granted: true }
        ]
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    log(`✅ Updated staff role permissions`, 'green');
    log(`   Message: ${response.data.message}`, 'blue');
    return true;
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testGetAllDocumentServices() {
  printTestHeader('TEST 7: Get All Document Services');
  try {
    const response = await axios.get(`${BASE_URL}/superadmin/document-services`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const services = response.data.data.services;
    log(`✅ Retrieved ${services.length} document services`, 'green');
    services.slice(0, 3).forEach(s => {
      log(`   - ${s.name}: ₱${s.processingFee} (${s.processingDays} days) [${s.isAvailable ? 'Active' : 'Inactive'}]`, 'blue');
    });
    return true;
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testCreateDocumentService() {
  printTestHeader('TEST 8: Create Document Service');
  try {
    const response = await axios.post(
      `${BASE_URL}/superadmin/document-services`,
      {
        name: 'Test Certificate',
        description: 'This is a test certificate for API testing',
        category: 'Testing',
        processingFee: 25.00,
        isFree: false,
        processingDays: 1,
        requirements: 'Valid ID, Proof of Residency',
        isAvailable: true
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    testServiceId = response.data.data.service.id;
    log(`✅ Created document service`, 'green');
    log(`   ID: ${testServiceId}`, 'blue');
    log(`   Name: ${response.data.data.service.name}`, 'blue');
    log(`   Fee: ₱${response.data.data.service.processingFee}`, 'blue');
    return true;
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testUpdateDocumentService() {
  printTestHeader('TEST 9: Update Document Service');
  if (!testServiceId) {
    log(`⚠️  Skipping: No test service created`, 'yellow');
    return false;
  }
  
  try {
    const response = await axios.put(
      `${BASE_URL}/superadmin/document-services/${testServiceId}`,
      {
        processingFee: 30.00,
        processingDays: 2
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    log(`✅ Updated document service`, 'green');
    log(`   New Fee: ₱${response.data.data.service.processingFee}`, 'blue');
    log(`   New Processing Days: ${response.data.data.service.processingDays}`, 'blue');
    return true;
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testGetAllSystemSettings() {
  printTestHeader('TEST 10: Get All System Settings');
  try {
    const response = await axios.get(`${BASE_URL}/superadmin/system-settings`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const grouped = response.data.data.groupedSettings;
    log(`✅ Retrieved system settings`, 'green');
    
    Object.keys(grouped).forEach(category => {
      log(`   ${category}: ${grouped[category].length} settings`, 'blue');
    });
    return true;
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testUpdateSystemSetting() {
  printTestHeader('TEST 11: Update System Setting');
  try {
    const response = await axios.put(
      `${BASE_URL}/superadmin/system-settings/barangay.name`,
      {
        value: 'Barangay Bakilid (Updated via API Test)'
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    log(`✅ Updated system setting`, 'green');
    log(`   Key: ${response.data.data.setting.key}`, 'blue');
    log(`   New Value: ${response.data.data.setting.value}`, 'blue');
    
    // Restore original value
    await axios.put(
      `${BASE_URL}/superadmin/system-settings/barangay.name`,
      { value: 'Barangay Bakilid' },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    log(`   ✓ Restored original value`, 'blue');
    return true;
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testBulkUpdateSystemSettings() {
  printTestHeader('TEST 12: Bulk Update System Settings');
  try {
    const response = await axios.put(
      `${BASE_URL}/superadmin/system-settings/bulk`,
      {
        settings: [
          { key: 'request.default_processing_days', value: '5' },
          { key: 'request.allow_online_submission', value: 'true' }
        ]
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    log(`✅ Bulk updated system settings`, 'green');
    log(`   Updated: ${response.data.data.updated} settings`, 'blue');
    return true;
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testGetAllFeatureFlags() {
  printTestHeader('TEST 13: Get All Feature Flags');
  try {
    const response = await axios.get(`${BASE_URL}/superadmin/feature-flags`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const flags = response.data.data.flags;
    log(`✅ Retrieved ${flags.length} feature flags`, 'green');
    flags.forEach(f => {
      log(`   - ${f.label}: ${f.isEnabled ? '✓ Enabled' : '✗ Disabled'}`, f.isEnabled ? 'green' : 'yellow');
    });
    return true;
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testToggleFeatureFlag() {
  printTestHeader('TEST 14: Toggle Feature Flag');
  try {
    // Toggle online payments feature
    const response = await axios.put(
      `${BASE_URL}/superadmin/feature-flags/feature.online_payments`,
      {
        isEnabled: true
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    log(`✅ Toggled feature flag`, 'green');
    log(`   Key: ${response.data.data.flag.key}`, 'blue');
    log(`   Status: ${response.data.data.flag.isEnabled ? 'Enabled' : 'Disabled'}`, 'blue');
    
    // Toggle back
    await axios.put(
      `${BASE_URL}/superadmin/feature-flags/feature.online_payments`,
      { isEnabled: false },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    log(`   ✓ Restored to disabled`, 'blue');
    return true;
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testGetAuditLogs() {
  printTestHeader('TEST 15: Get Audit Logs');
  try {
    const response = await axios.get(`${BASE_URL}/superadmin/audit-logs?limit=5`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const logs = response.data.data.logs;
    log(`✅ Retrieved ${logs.length} audit logs`, 'green');
    logs.forEach(l => {
      log(`   - [${l.action}] ${l.module}: ${l.description} (${l.status})`, 'blue');
    });
    return true;
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testDeleteDocumentService() {
  printTestHeader('TEST 16: Delete (Deactivate) Document Service');
  if (!testServiceId) {
    log(`⚠️  Skipping: No test service to delete`, 'yellow');
    return false;
  }
  
  try {
    const response = await axios.delete(
      `${BASE_URL}/superadmin/document-services/${testServiceId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    log(`✅ Deactivated document service`, 'green');
    log(`   Message: ${response.data.message}`, 'blue');
    return true;
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  console.clear();
  log('🧪 SUPERADMIN API COMPREHENSIVE TEST SUITE', 'cyan');
  log('════════════════════════════════════════════════════════════\n', 'cyan');
  
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0
  };
  
  const tests = [
    loginAsAdmin,
    testDashboardStats,
    testGetAllPermissions,
    testGetPermissionMatrix,
    testGetRolePermissions,
    testUpdateRolePermissions,
    testGetAllDocumentServices,
    testCreateDocumentService,
    testUpdateDocumentService,
    testGetAllSystemSettings,
    testUpdateSystemSetting,
    testBulkUpdateSystemSettings,
    testGetAllFeatureFlags,
    testToggleFeatureFlag,
    testGetAuditLogs,
    testDeleteDocumentService
  ];
  
  for (const test of tests) {
    const result = await test();
    if (result === true) {
      results.passed++;
    } else if (result === false) {
      results.failed++;
    } else {
      results.skipped++;
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
  }
  
  // Final Summary
  console.log('\n' + '='.repeat(60));
  log('📊 TEST SUMMARY', 'cyan');
  console.log('='.repeat(60));
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, 'red');
  log(`⚠️  Skipped: ${results.skipped}`, 'yellow');
  log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`, 'cyan');
  console.log('='.repeat(60));
  
  if (results.failed === 0) {
    log('\n🎉 ALL SUPERADMIN API TESTS PASSED!', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please review the output above.', 'yellow');
  }
  
  process.exit(results.failed === 0 ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  log(`\n💥 Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
