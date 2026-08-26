import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Test counter
let passedTests = 0;
let failedTests = 0;
const failedEndpoints = [];

const log = {
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  info: (msg) => console.log(`ℹ️  ${msg}`),
  section: (msg) => console.log(`\n${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}`),
};

// Helper function to make authenticated requests
const authenticatedRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status,
    };
  }
};

// Test: Login as admin
async function testLogin() {
  log.section('1. Testing Admin Login');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@bakilid.gov.ph',
      password: 'admin123',
      turnstileToken: 'test-bypass-token',
    });
    
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.token) {
      authToken = response.data.token;
      log.success('Admin login successful');
      log.info(`Token: ${authToken.substring(0, 20)}...`);
      passedTests++;
      return true;
    } else {
      log.error('Login failed: No token received');
      failedTests++;
      failedEndpoints.push('POST /auth/login');
      return false;
    }
  } catch (error) {
    log.error(`Login failed: ${error.response?.data?.message || error.message}`);
    failedTests++;
    failedEndpoints.push('POST /auth/login');
    return false;
  }
}

// Test: Dashboard Stats
async function testDashboardStats() {
  log.section('2. Testing Dashboard Stats');
  
  const result = await authenticatedRequest('GET', '/superadmin/dashboard');
  
  if (result.success) {
    log.success('Dashboard stats retrieved successfully');
    log.info(`Users: ${result.data.data.users?.total || 0}`);
    log.info(`Residents: ${result.data.data.residents?.total || 0}`);
    log.info(`Document Services: ${result.data.data.documentServices?.total || 0}`);
    passedTests++;
  } else {
    log.error(`Dashboard stats failed: ${result.error}`);
    failedTests++;
    failedEndpoints.push('GET /superadmin/dashboard');
  }
}

// Test: Get All Permissions
async function testGetPermissions() {
  log.section('3. Testing Get All Permissions');
  
  const result = await authenticatedRequest('GET', '/superadmin/permissions');
  
  if (result.success) {
    const permissions = result.data.data.permissions;
    log.success(`Retrieved ${permissions?.length || 0} permissions`);
    passedTests++;
    return permissions;
  } else {
    log.error(`Get permissions failed: ${result.error}`);
    failedTests++;
    failedEndpoints.push('GET /superadmin/permissions');
    return [];
  }
}

// Test: Get Permission Matrix
async function testGetPermissionMatrix() {
  log.section('4. Testing Get Permission Matrix');
  
  const result = await authenticatedRequest('GET', '/superadmin/permissions/matrix');
  
  if (result.success) {
    const matrix = result.data.data.permissionMatrix;
    log.success(`Retrieved permission matrix with ${matrix?.length || 0} entries`);
    passedTests++;
  } else {
    log.error(`Get permission matrix failed: ${result.error}`);
    failedTests++;
    failedEndpoints.push('GET /superadmin/permissions/matrix');
  }
}

// Test: Get Role Permissions
async function testGetRolePermissions() {
  log.section('5. Testing Get Role Permissions');
  
  const roles = ['captain', 'secretary', 'staff'];
  
  for (const role of roles) {
    const result = await authenticatedRequest('GET', `/superadmin/permissions/${role}`);
    
    if (result.success) {
      log.success(`Retrieved permissions for ${role}`);
      passedTests++;
    } else {
      log.error(`Get ${role} permissions failed: ${result.error}`);
      failedTests++;
      failedEndpoints.push(`GET /superadmin/permissions/${role}`);
    }
  }
}

// Test: Document Services
async function testDocumentServices() {
  log.section('6. Testing Document Services CRUD');
  
  // GET all services
  const getResult = await authenticatedRequest('GET', '/superadmin/document-services');
  
  if (getResult.success) {
    const services = getResult.data.data.services;
    log.success(`Retrieved ${services?.length || 0} document services`);
    passedTests++;
    
    // Test CREATE (if there are less than 15 services)
    if (services.length < 15) {
      const timestamp = Date.now();
      const createResult = await authenticatedRequest('POST', '/superadmin/document-services', {
        name: `Test Service ${timestamp}`,
        description: 'This is a test service created by automated testing',
        category: 'Certificate',
        processingFee: 50,
        isFree: false,
        processingDays: 3,
        requirements: 'Valid ID, Proof of residency',
        isAvailable: true,
      });
      
      if (createResult.success) {
        log.success('Document service created successfully');
        const newServiceId = createResult.data.data.service.id;
        passedTests++;
        
        // Test UPDATE
        const updateTimestamp = Date.now();
        const updateResult = await authenticatedRequest(
          'PUT',
          `/superadmin/document-services/${newServiceId}`,
          {
            name: `Test Service Updated ${updateTimestamp}`,
            processingFee: 75,
          }
        );
        
        if (updateResult.success) {
          log.success('Document service updated successfully');
          passedTests++;
        } else {
          log.error(`Update service failed: ${updateResult.error}`);
          failedTests++;
          failedEndpoints.push('PUT /superadmin/document-services/:id');
        }
        
        // Test DELETE
        const deleteResult = await authenticatedRequest(
          'DELETE',
          `/superadmin/document-services/${newServiceId}`
        );
        
        if (deleteResult.success) {
          log.success('Document service deleted successfully');
          passedTests++;
        } else {
          log.error(`Delete service failed: ${deleteResult.error}`);
          failedTests++;
          failedEndpoints.push('DELETE /superadmin/document-services/:id');
        }
      } else {
        log.error(`Create service failed: ${createResult.error}`);
        failedTests++;
        failedEndpoints.push('POST /superadmin/document-services');
      }
    }
  } else {
    log.error(`Get document services failed: ${getResult.error}`);
    failedTests++;
    failedEndpoints.push('GET /superadmin/document-services');
  }
}

// Test: System Settings
async function testSystemSettings() {
  log.section('7. Testing System Settings');
  
  // GET all settings
  const getResult = await authenticatedRequest('GET', '/superadmin/settings');
  
  if (getResult.success) {
    const settings = getResult.data.data.groupedSettings;
    log.success(`Retrieved system settings (${Object.keys(settings).length} categories)`);
    passedTests++;
    
    // Test UPDATE settings
    const updateResult = await authenticatedRequest('PUT', '/superadmin/settings-bulk', {
      settings: [
        { key: 'app.name', value: 'Barangay Smart System - Test' },
      ],
    });
    
    if (updateResult.success) {
      log.success('System settings updated successfully');
      passedTests++;
      
      // Restore original value
      await authenticatedRequest('PUT', '/superadmin/settings-bulk', {
        settings: [
          { key: 'app.name', value: 'Barangay Bakilid Management System' },
        ],
      });
    } else {
      log.error(`Update system settings failed: ${updateResult.error}`);
      failedTests++;
      failedEndpoints.push('PUT /superadmin/settings-bulk');
    }
  } else {
    log.error(`Get system settings failed: ${getResult.error}`);
    failedTests++;
    failedEndpoints.push('GET /superadmin/settings');
  }
}

// Test: Feature Flags
async function testFeatureFlags() {
  log.section('8. Testing Feature Flags');
  
  // GET all flags
  const getResult = await authenticatedRequest('GET', '/superadmin/feature-flags');
  
  if (getResult.success) {
    const flags = getResult.data.data.flags;
    log.success(`Retrieved ${flags?.length || 0} feature flags`);
    passedTests++;
    
    // Test TOGGLE flag (if any flags exist)
    if (flags && flags.length > 0) {
      const testFlag = flags[0];
      const originalState = testFlag.isEnabled;
      
      const toggleResult = await authenticatedRequest(
        'PATCH',
        `/superadmin/feature-flags/${testFlag.key}/toggle`,
        { isEnabled: !originalState }
      );
      
      if (toggleResult.success) {
        log.success(`Feature flag '${testFlag.key}' toggled successfully`);
        passedTests++;
        
        // Restore original state
        await authenticatedRequest(
          'PATCH',
          `/superadmin/feature-flags/${testFlag.key}/toggle`,
          { isEnabled: originalState }
        );
      } else {
        log.error(`Toggle feature flag failed: ${toggleResult.error}`);
        failedTests++;
        failedEndpoints.push('PATCH /superadmin/feature-flags/:key/toggle');
      }
    }
  } else {
    log.error(`Get feature flags failed: ${getResult.error}`);
    failedTests++;
    failedEndpoints.push('GET /superadmin/feature-flags');
  }
}

// Test: Audit Logs
async function testAuditLogs() {
  log.section('9. Testing Audit Logs');
  
  const result = await authenticatedRequest('GET', '/superadmin/audit-logs?limit=10');
  
  if (result.success) {
    const logs = result.data.data.logs;
    log.success(`Retrieved ${logs?.length || 0} audit logs`);
    passedTests++;
  } else {
    log.error(`Get audit logs failed: ${result.error}`);
    failedTests++;
    failedEndpoints.push('GET /superadmin/audit-logs');
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n🧪 SUPERADMIN API ENDPOINT TESTING');
  console.log('===================================\n');
  
  const loginSuccess = await testLogin();
  
  if (!loginSuccess) {
    log.error('Cannot proceed without authentication token');
    return;
  }
  
  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Run all tests
  await testDashboardStats();
  await testGetPermissions();
  await testGetPermissionMatrix();
  await testGetRolePermissions();
  await testDocumentServices();
  await testSystemSettings();
  await testFeatureFlags();
  await testAuditLogs();
  
  // Print summary
  log.section('TEST SUMMARY');
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📊 Total:  ${passedTests + failedTests}`);
  console.log(`🎯 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
  
  if (failedEndpoints.length > 0) {
    console.log('\n❌ Failed Endpoints:');
    failedEndpoints.forEach(endpoint => console.log(`   - ${endpoint}`));
  }
  
  console.log('\n');
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
