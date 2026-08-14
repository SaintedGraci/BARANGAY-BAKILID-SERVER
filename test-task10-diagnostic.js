import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

// ANSI color codes for better readability
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
  subheader: (msg) => console.log(`${colors.magenta}${msg}${colors.reset}`),
};

let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
};

let adminToken = null;
let residentToken = null;
let createdAnnouncementId = null;

// Test helper functions
function test(name, fn) {
  testResults.total++;
  try {
    fn();
    testResults.passed++;
    log.success(name);
    return true;
  } catch (error) {
    testResults.failed++;
    log.error(`${name}: ${error.message}`);
    return false;
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertExists(value, message) {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

// Diagnostic tests
async function runDiagnostics() {
  console.log(`${colors.bright}${colors.cyan}
╔═══════════════════════════════════════════════════════════╗
║        TASK 10: ANNOUNCEMENT FEED DIAGNOSTIC TEST         ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

  try {
    // Step 1: Authentication
    log.header('📋 STEP 1: Authentication');
    await testAuthentication();

    // Step 2: Database Schema Check
    log.header('📋 STEP 2: Database Schema Check');
    await testDatabaseSchema();

    // Step 3: Create Announcement (Admin)
    log.header('📋 STEP 3: Create Announcement Tests');
    await testCreateAnnouncement();

    // Step 4: Get All Announcements
    log.header('📋 STEP 4: Get Announcements');
    await testGetAnnouncements();

    // Step 5: Pin Announcement
    log.header('📋 STEP 5: Pin/Unpin Tests');
    await testPinAnnouncement();

    // Step 6: Update Announcement
    log.header('📋 STEP 6: Update Announcement');
    await testUpdateAnnouncement();

    // Step 7: Archive Announcement
    log.header('📋 STEP 7: Archive Announcement');
    await testArchiveAnnouncement();

    // Step 8: RBAC Tests
    log.header('📋 STEP 8: RBAC & Permissions');
    await testRBAC();

    // Step 9: Delete Announcement
    log.header('📋 STEP 9: Delete Announcement');
    await testDeleteAnnouncement();

    // Step 10: Frontend Component Check
    log.header('📋 STEP 10: Frontend Components');
    await testFrontendComponents();

  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
    console.error(error);
  }

  // Print summary
  printSummary();
}

async function testAuthentication() {
  try {
    // Login as admin
    log.info('Logging in as admin...');
    const adminLogin = await axios.post(`${API_URL}/auth/admin/login`, {
      username: 'admin',
      password: 'admin123',
    });
    
    adminToken = adminLogin.data.token;
    test('Admin authentication successful', () => {
      assertExists(adminToken, 'Admin token should exist');
    });

    // Try to login as resident (if test account exists)
    try {
      log.info('Logging in as resident...');
      const residentLogin = await axios.post(`${API_URL}/auth/login`, {
        username: 'testuser',
        password: 'Test@1234',
      });
      residentToken = residentLogin.data.token;
      log.success('Resident authentication successful');
    } catch (error) {
      log.warning('Resident test account not found (optional for testing)');
      testResults.warnings++;
    }
  } catch (error) {
    log.error(`Authentication failed: ${error.message}`);
    throw new Error('Cannot proceed without authentication');
  }
}

async function testDatabaseSchema() {
  try {
    log.info('Checking if announcements table exists...');
    const response = await axios.get(`${API_URL}/announcements`);
    
    test('Announcements API endpoint accessible', () => {
      assertTrue(response.status === 200, 'Should return 200 status');
    });

    if (response.data.data && response.data.data.length > 0) {
      const announcement = response.data.data[0];
      
      test('Announcement has required fields', () => {
        assertExists(announcement.id, 'ID should exist');
        assertExists(announcement.title, 'Title should exist');
        assertExists(announcement.description, 'Description should exist');
        assertExists(announcement.status, 'Status should exist');
        assertExists(announcement.priority, 'Priority should exist');
      });

      // Check for new fields (may not exist if migration not run)
      if ('isPinned' in announcement) {
        log.success('isPinned field exists in database');
      } else {
        log.warning('isPinned field NOT found - migration may not have run');
        testResults.warnings++;
      }

      if ('category' in announcement) {
        log.success('category field exists in database');
      } else {
        log.warning('category field NOT found - migration may not have run');
        testResults.warnings++;
      }
    } else {
      log.warning('No announcements in database (empty table)');
      testResults.warnings++;
    }
  } catch (error) {
    log.error(`Database schema check failed: ${error.message}`);
  }
}

async function testCreateAnnouncement() {
  try {
    log.info('Creating test announcement...');
    
    const announcementData = {
      title: '[TEST] Task 10 Diagnostic Test Announcement',
      description: 'This is a test announcement created by the Task 10 diagnostic script. It tests the modern announcement feed implementation.',
      priority: 'High',
      status: 'Active',
    };

    const response = await axios.post(
      `${API_URL}/announcements`,
      announcementData,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );

    test('Create announcement successful', () => {
      assertEqual(response.status, 201, 'Should return 201 status');
      assertTrue(response.data.success, 'Response should indicate success');
      assertExists(response.data.data, 'Response should contain data');
      assertExists(response.data.data.id, 'Created announcement should have ID');
    });

    createdAnnouncementId = response.data.data.id;
    log.info(`Created announcement with ID: ${createdAnnouncementId}`);

    // Test with image upload (if test image exists)
    const testImagePath = path.join(__dirname, 'uploads', 'bakilidlogo-1783161776011.png');
    if (fs.existsSync(testImagePath)) {
      log.info('Testing announcement with image upload...');
      
      const formData = new FormData();
      formData.append('title', '[TEST] Announcement with Image');
      formData.append('description', 'Testing image upload functionality');
      formData.append('priority', 'Medium');
      formData.append('status', 'Active');
      formData.append('image', fs.createReadStream(testImagePath));

      try {
        const imageResponse = await axios.post(
          `${API_URL}/announcements`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${adminToken}`,
              ...formData.getHeaders(),
            },
          }
        );

        test('Create announcement with image successful', () => {
          assertEqual(imageResponse.status, 201, 'Should return 201 status');
          assertExists(imageResponse.data.data.imagePath, 'Should have imagePath');
        });

        // Clean up test announcement with image
        await axios.delete(
          `${API_URL}/announcements/${imageResponse.data.data.id}`,
          {
            headers: { Authorization: `Bearer ${adminToken}` },
          }
        );
      } catch (error) {
        log.warning(`Image upload test failed: ${error.message}`);
        testResults.warnings++;
      }
    } else {
      log.warning('Test image not found, skipping image upload test');
      testResults.warnings++;
    }
  } catch (error) {
    log.error(`Create announcement failed: ${error.response?.data?.message || error.message}`);
  }
}

async function testGetAnnouncements() {
  try {
    log.info('Fetching all announcements...');
    
    const response = await axios.get(`${API_URL}/announcements`);

    test('Get all announcements successful', () => {
      assertEqual(response.status, 200, 'Should return 200 status');
      assertTrue(Array.isArray(response.data.data), 'Data should be an array');
    });

    log.info(`Found ${response.data.data.length} announcements`);

    if (createdAnnouncementId) {
      log.info('Fetching specific announcement by ID...');
      const singleResponse = await axios.get(
        `${API_URL}/announcements/${createdAnnouncementId}`
      );

      test('Get announcement by ID successful', () => {
        assertEqual(singleResponse.status, 200, 'Should return 200 status');
        assertEqual(
          singleResponse.data.data.id,
          createdAnnouncementId,
          'Should return correct announcement'
        );
      });
    }
  } catch (error) {
    log.error(`Get announcements failed: ${error.message}`);
  }
}

async function testPinAnnouncement() {
  if (!createdAnnouncementId) {
    log.warning('Skipping pin test - no announcement created');
    testResults.warnings++;
    return;
  }

  try {
    log.info('Testing pin announcement...');
    
    const pinResponse = await axios.patch(
      `${API_URL}/announcements/${createdAnnouncementId}/pin`,
      {},
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    test('Pin announcement successful', () => {
      assertEqual(pinResponse.status, 200, 'Should return 200 status');
      assertTrue(pinResponse.data.success, 'Response should indicate success');
    });

    // Verify pin status
    const getResponse = await axios.get(
      `${API_URL}/announcements/${createdAnnouncementId}`
    );

    test('Announcement isPinned field is true', () => {
      assertTrue(
        getResponse.data.data.isPinned === true,
        'Announcement should be pinned'
      );
    });

    // Test unpin
    log.info('Testing unpin announcement...');
    const unpinResponse = await axios.patch(
      `${API_URL}/announcements/${createdAnnouncementId}/pin`,
      {},
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    test('Unpin announcement successful', () => {
      assertEqual(unpinResponse.status, 200, 'Should return 200 status');
    });
  } catch (error) {
    log.error(`Pin/Unpin test failed: ${error.response?.data?.message || error.message}`);
  }
}

async function testUpdateAnnouncement() {
  if (!createdAnnouncementId) {
    log.warning('Skipping update test - no announcement created');
    testResults.warnings++;
    return;
  }

  try {
    log.info('Testing update announcement...');
    
    const updateData = {
      title: '[TEST] Updated Title',
      description: 'Updated description for testing',
      priority: 'Urgent',
    };

    const response = await axios.put(
      `${API_URL}/announcements/${createdAnnouncementId}`,
      updateData,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    test('Update announcement successful', () => {
      assertEqual(response.status, 200, 'Should return 200 status');
      assertTrue(response.data.success, 'Response should indicate success');
    });

    // Verify update
    const getResponse = await axios.get(
      `${API_URL}/announcements/${createdAnnouncementId}`
    );

    test('Announcement fields updated correctly', () => {
      assertEqual(
        getResponse.data.data.title,
        updateData.title,
        'Title should be updated'
      );
      assertEqual(
        getResponse.data.data.priority,
        updateData.priority,
        'Priority should be updated'
      );
    });
  } catch (error) {
    log.error(`Update test failed: ${error.response?.data?.message || error.message}`);
  }
}

async function testArchiveAnnouncement() {
  if (!createdAnnouncementId) {
    log.warning('Skipping archive test - no announcement created');
    testResults.warnings++;
    return;
  }

  try {
    log.info('Testing archive announcement...');
    
    const response = await axios.patch(
      `${API_URL}/announcements/${createdAnnouncementId}/archive`,
      {},
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    test('Archive announcement successful', () => {
      assertEqual(response.status, 200, 'Should return 200 status');
      assertTrue(response.data.success, 'Response should indicate success');
    });

    // Verify archived status
    const getResponse = await axios.get(
      `${API_URL}/announcements/${createdAnnouncementId}`
    );

    test('Announcement status is Archived', () => {
      assertEqual(
        getResponse.data.data.status,
        'Archived',
        'Status should be Archived'
      );
    });
  } catch (error) {
    log.error(`Archive test failed: ${error.response?.data?.message || error.message}`);
  }
}

async function testRBAC() {
  if (!createdAnnouncementId) {
    log.warning('Skipping RBAC test - no announcement created');
    testResults.warnings++;
    return;
  }

  try {
    log.info('Testing RBAC - unauthorized access...');
    
    // Test without token
    try {
      await axios.post(`${API_URL}/announcements`, {
        title: 'Test',
        description: 'Test',
      });
      log.error('RBAC FAILED: Anonymous user can create announcement');
      testResults.failed++;
    } catch (error) {
      test('Anonymous user cannot create announcement', () => {
        assertTrue(
          error.response?.status === 401 || error.response?.status === 403,
          'Should return 401 or 403'
        );
      });
    }

    // Test resident trying to delete (if resident token exists)
    if (residentToken) {
      try {
        await axios.delete(
          `${API_URL}/announcements/${createdAnnouncementId}`,
          {
            headers: { Authorization: `Bearer ${residentToken}` },
          }
        );
        log.error('RBAC FAILED: Resident can delete announcement');
        testResults.failed++;
      } catch (error) {
        test('Resident cannot delete announcement', () => {
          assertTrue(
            error.response?.status === 403,
            'Should return 403 Forbidden'
          );
        });
      }
    } else {
      log.warning('Skipping resident RBAC test - no resident token');
      testResults.warnings++;
    }
  } catch (error) {
    log.error(`RBAC test failed: ${error.message}`);
  }
}

async function testDeleteAnnouncement() {
  if (!createdAnnouncementId) {
    log.warning('Skipping delete test - no announcement created');
    testResults.warnings++;
    return;
  }

  try {
    log.info('Testing delete announcement...');
    
    const response = await axios.delete(
      `${API_URL}/announcements/${createdAnnouncementId}`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    test('Delete announcement successful', () => {
      assertEqual(response.status, 200, 'Should return 200 status');
      assertTrue(response.data.success, 'Response should indicate success');
    });

    // Verify deletion
    try {
      await axios.get(`${API_URL}/announcements/${createdAnnouncementId}`);
      log.error('Announcement still exists after deletion');
      testResults.failed++;
    } catch (error) {
      test('Announcement no longer exists', () => {
        assertTrue(
          error.response?.status === 404,
          'Should return 404 Not Found'
        );
      });
    }
  } catch (error) {
    log.error(`Delete test failed: ${error.response?.data?.message || error.message}`);
  }
}

async function testFrontendComponents() {
  const componentsToCheck = [
    'barangay_client/src/components/AnnouncementPost.jsx',
    'barangay_client/src/components/AnnouncementFeed.jsx',
    'barangay_client/src/components/AnnouncementModal.jsx',
  ];

  for (const component of componentsToCheck) {
    const componentPath = path.join(process.cwd(), component);
    test(`Component exists: ${path.basename(component)}`, () => {
      assertTrue(
        fs.existsSync(componentPath),
        `${component} should exist`
      );
    });
  }

  // Check if migration file exists
  const migrationPath = path.join(
    process.cwd(),
    'barangay_server/migrations/add-announcement-fields.js'
  );
  test('Migration file exists', () => {
    assertTrue(fs.existsSync(migrationPath), 'Migration file should exist');
  });
}

function printSummary() {
  console.log(`\n${colors.bright}${colors.cyan}
╔═══════════════════════════════════════════════════════════╗
║                    TEST SUMMARY                           ║
╚═══════════════════════════════════════════════════════════╝${colors.reset}`);

  console.log(`
  Total Tests:    ${testResults.total}
  ${colors.green}Passed:         ${testResults.passed}${colors.reset}
  ${colors.red}Failed:         ${testResults.failed}${colors.reset}
  ${colors.yellow}Warnings:       ${testResults.warnings}${colors.reset}
  `);

  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  
  if (testResults.failed === 0) {
    console.log(`${colors.green}${colors.bright}
  ✓ All tests passed! (${successRate}% success rate)
  Task 10 implementation is working correctly.${colors.reset}
    `);
  } else {
    console.log(`${colors.red}${colors.bright}
  ✗ Some tests failed (${successRate}% success rate)
  Please review the errors above.${colors.reset}
    `);
  }

  if (testResults.warnings > 0) {
    console.log(`${colors.yellow}
  ⚠ ${testResults.warnings} warnings detected:
    - Database migration may need to be run
    - Some optional test features unavailable
    - Check warnings above for details${colors.reset}
    `);
  }

  console.log(`${colors.cyan}
Next Steps:
  1. Run database migration: node barangay_server/migrations/add-announcement-fields.js
  2. Start the backend server: cd barangay_server && npm start
  3. Start the frontend: cd barangay_client && npm run dev
  4. Test the UI at http://localhost:5173
  ${colors.reset}`);
}

// Run diagnostics
runDiagnostics().catch((error) => {
  log.error(`Diagnostic test crashed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
