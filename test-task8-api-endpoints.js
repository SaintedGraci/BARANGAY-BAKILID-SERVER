/**
 * ============================================
 * TASK 8 - API Endpoint Integration Tests
 * ============================================
 * 
 * Tests the actual HTTP endpoints with authentication
 * 
 * Prerequisites:
 * 1. Server must be running (npm start)
 * 2. You must have a valid test account
 * 
 * Run: node test-task8-api-endpoints.js
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:5000';
let authToken = '';
let testImageId = null;

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
};

function log(status, message, details = '') {
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'INFO' ? 'ℹ️' : '⚠️';
    const color = status === 'PASS' ? colors.green : status === 'FAIL' ? colors.red : status === 'WARN' ? colors.yellow : colors.blue;
    console.log(`${color}${icon} ${message}${colors.reset}`);
    if (details) console.log(`   ${details}`);
}

// Test 1: Login to get auth token
async function testLogin() {
    console.log('\n📊 TEST 1: Authentication');
    console.log('─'.repeat(50));
    
    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@bakilid.gov',
                password: 'Bakilid2024!'
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.token) {
            authToken = data.token;
            log('PASS', 'Login successful', `Token: ${authToken.substring(0, 20)}...`);
            return true;
        } else {
            log('FAIL', 'Login failed', data.message || 'No token received');
            log('INFO', 'Using default test credentials: admin@bakilid.gov / Bakilid2024!');
            log('INFO', 'Update credentials in this script if needed');
            return false;
        }
    } catch (error) {
        log('FAIL', 'Login request failed', error.message);
        log('WARN', 'Is the server running? Start with: npm start');
        return false;
    }
}

// Test 2: Upload image
async function testImageUpload() {
    console.log('\n📊 TEST 2: Upload Image');
    console.log('─'.repeat(50));
    
    try {
        // Create a test PNG image (10x10 red square)
        const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAP0KBQzxpKlyAAAAAElFTkSuQmCC';
        const testBuffer = Buffer.from(testImageBase64, 'base64');
        
        // Create form data
        const formData = new FormData();
        formData.append('image', testBuffer, {
            filename: 'test-upload.png',
            contentType: 'image/png'
        });
        formData.append('category', 'test');
        formData.append('relatedType', 'Test');
        formData.append('relatedId', '1');
        
        const response = await fetch(`${API_URL}/api/images/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                ...formData.getHeaders()
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            testImageId = data.data.id;
            log('PASS', 'Image uploaded successfully', `ID: ${testImageId}`);
            log('INFO', 'Image URL', data.data.url);
            log('INFO', 'Dimensions', `${data.data.width}x${data.data.height}`);
            log('INFO', 'Size', `${(data.data.size / 1024).toFixed(2)} KB`);
            return true;
        } else {
            log('FAIL', 'Upload failed', data.message || JSON.stringify(data));
            return false;
        }
    } catch (error) {
        log('FAIL', 'Upload request failed', error.message);
        return false;
    }
}

// Test 3: Get all images
async function testGetAllImages() {
    console.log('\n📊 TEST 3: Get All Images');
    console.log('─'.repeat(50));
    
    try {
        const response = await fetch(`${API_URL}/api/images?limit=10`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            log('PASS', 'Retrieved images', `Found ${data.data.images.length} images`);
            log('INFO', 'Total count', data.data.total);
            log('INFO', 'Pagination', `Limit: ${data.data.limit}, Offset: ${data.data.offset}`);
            return true;
        } else {
            log('FAIL', 'Failed to get images', data.message || JSON.stringify(data));
            return false;
        }
    } catch (error) {
        log('FAIL', 'Get images request failed', error.message);
        return false;
    }
}

// Test 4: Get single image by ID
async function testGetImageById() {
    console.log('\n📊 TEST 4: Get Image by ID');
    console.log('─'.repeat(50));
    
    if (!testImageId) {
        log('WARN', 'Skipping test', 'No test image ID available');
        return true;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/images/${testImageId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            log('PASS', 'Retrieved image by ID', `ID: ${testImageId}`);
            log('INFO', 'Original name', data.data.original_name);
            log('INFO', 'Category', data.data.category);
            log('INFO', 'Related', `${data.data.related_type} #${data.data.related_id}`);
            return true;
        } else {
            log('FAIL', 'Failed to get image', data.message || JSON.stringify(data));
            return false;
        }
    } catch (error) {
        log('FAIL', 'Get image request failed', error.message);
        return false;
    }
}

// Test 5: Filter images by category
async function testFilterByCategory() {
    console.log('\n📊 TEST 5: Filter by Category');
    console.log('─'.repeat(50));
    
    try {
        const response = await fetch(`${API_URL}/api/images?category=test`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            log('PASS', 'Filtered by category', `Found ${data.data.images.length} test images`);
            return true;
        } else {
            log('FAIL', 'Failed to filter images', data.message || JSON.stringify(data));
            return false;
        }
    } catch (error) {
        log('FAIL', 'Filter request failed', error.message);
        return false;
    }
}

// Test 6: Delete image (soft delete)
async function testSoftDelete() {
    console.log('\n📊 TEST 6: Soft Delete Image');
    console.log('─'.repeat(50));
    
    if (!testImageId) {
        log('WARN', 'Skipping test', 'No test image ID available');
        return true;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/images/${testImageId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            log('PASS', 'Image soft deleted', `ID: ${testImageId}`);
            log('INFO', 'Note', 'Image marked as deleted but still in R2');
            return true;
        } else {
            log('FAIL', 'Failed to delete image', data.message || JSON.stringify(data));
            return false;
        }
    } catch (error) {
        log('FAIL', 'Delete request failed', error.message);
        return false;
    }
}

// Test 7: Hard delete image
async function testHardDelete() {
    console.log('\n📊 TEST 7: Hard Delete Image');
    console.log('─'.repeat(50));
    
    if (!testImageId) {
        log('WARN', 'Skipping test', 'No test image ID available');
        return true;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/images/${testImageId}?hardDelete=true`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            log('PASS', 'Image hard deleted', `ID: ${testImageId}`);
            log('INFO', 'Note', 'Image removed from database and R2');
            return true;
        } else {
            log('FAIL', 'Failed to hard delete image', data.message || JSON.stringify(data));
            return false;
        }
    } catch (error) {
        log('FAIL', 'Hard delete request failed', error.message);
        return false;
    }
}

// Main test runner
async function runAllTests() {
    console.log('\n');
    console.log('═'.repeat(50));
    console.log('   TASK 8 - API ENDPOINT INTEGRATION TESTS');
    console.log('═'.repeat(50));
    
    log('INFO', 'API URL', API_URL);
    log('INFO', 'Prerequisites', 'Server must be running on port 5000');
    
    const results = {
        passed: 0,
        failed: 0
    };
    
    // Run tests sequentially
    if (await testLogin()) results.passed++; else { results.failed++; return; }
    if (await testImageUpload()) results.passed++; else results.failed++;
    if (await testGetAllImages()) results.passed++; else results.failed++;
    if (await testGetImageById()) results.passed++; else results.failed++;
    if (await testFilterByCategory()) results.passed++; else results.failed++;
    if (await testSoftDelete()) results.passed++; else results.failed++;
    if (await testHardDelete()) results.passed++; else results.failed++;
    
    // Print summary
    console.log('\n');
    console.log('═'.repeat(50));
    console.log('   TEST SUMMARY');
    console.log('═'.repeat(50));
    console.log(`${colors.green}✅ Passed: ${results.passed}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${results.failed}${colors.reset}`);
    console.log('═'.repeat(50));
    
    if (results.failed === 0) {
        console.log(`\n${colors.green}🎉 ALL API TESTS PASSED!${colors.reset}\n`);
        console.log('TASK 8 image optimization API is fully functional!\n');
    } else {
        console.log(`\n${colors.red}⚠️  Some tests failed.${colors.reset}\n`);
    }
    
    process.exit(results.failed === 0 ? 0 : 1);
}

// Check if server is reachable first
async function checkServer() {
    try {
        const response = await fetch(`${API_URL}/api/health`, {
            method: 'GET',
            timeout: 5000
        });
        
        if (response.ok) {
            log('PASS', 'Server is reachable', API_URL);
            return true;
        } else {
            log('WARN', 'Server responded but health check failed');
            return false;
        }
    } catch (error) {
        log('FAIL', 'Cannot reach server', error.message);
        log('INFO', 'Start the server with: npm start');
        log('INFO', 'Or update API_URL if server is on a different port');
        return false;
    }
}

// Start tests
console.log('\nChecking server status...');
checkServer().then(isReachable => {
    if (isReachable) {
        runAllTests();
    } else {
        console.log(`\n${colors.yellow}⚠️  Please start the server first:${colors.reset}`);
        console.log('   cd barangay_server');
        console.log('   npm start\n');
        process.exit(1);
    }
});
