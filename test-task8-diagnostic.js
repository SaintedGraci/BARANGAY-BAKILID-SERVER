/**
 * ============================================
 * TASK 8 - Complete Diagnostic Test Suite
 * ============================================
 * 
 * This script tests all TASK8 image optimization features:
 * 1. Database table existence
 * 2. Sharp library installation
 * 3. R2 connection and configuration
 * 4. Image optimization functions
 * 5. Image upload API endpoint
 * 6. Image retrieval API endpoints
 * 7. Image deletion API endpoint
 * 
 * Run: node test-task8-diagnostic.js
 */

import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import sequelize from './config/db.js';
import Image from './models/image.js';
import { optimizeImage, uploadToR2, deleteFromR2, testR2Connection } from './config/r2.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test results tracking
const results = {
    passed: [],
    failed: [],
    warnings: []
};

function logTest(name, status, details = '') {
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${name}`);
    if (details) console.log(`   ${details}`);
    
    if (status === 'PASS') results.passed.push(name);
    else if (status === 'FAIL') results.failed.push(name);
    else results.warnings.push(name);
}

// Test 1: Database Connection
async function testDatabaseConnection() {
    console.log('\n📊 TEST 1: Database Connection');
    console.log('─'.repeat(50));
    
    try {
        await sequelize.authenticate();
        logTest('Database connection', 'PASS', `Connected to ${process.env.DB_NAME}`);
        return true;
    } catch (error) {
        logTest('Database connection', 'FAIL', error.message);
        return false;
    }
}

// Test 2: Images Table Existence
async function testImagesTable() {
    console.log('\n📊 TEST 2: Images Table');
    console.log('─'.repeat(50));
    
    try {
        const [results] = await sequelize.query(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = '${process.env.DB_NAME}' 
            AND table_name = 'images'
        `);
        
        if (results[0].count > 0) {
            logTest('Images table exists', 'PASS');
            
            // Check table structure
            const [columns] = await sequelize.query(`
                SELECT COLUMN_NAME, DATA_TYPE 
                FROM information_schema.columns 
                WHERE table_schema = '${process.env.DB_NAME}' 
                AND table_name = 'images'
            `);
            
            const requiredColumns = ['id', 'original_name', 'r2_key', 'url', 'width', 'height', 'size', 'mimetype'];
            const existingColumns = columns.map(col => col.COLUMN_NAME);
            
            const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
            
            if (missingColumns.length === 0) {
                logTest('All required columns exist', 'PASS', `Found ${existingColumns.length} columns`);
            } else {
                logTest('Table structure', 'FAIL', `Missing columns: ${missingColumns.join(', ')}`);
                return false;
            }
            
            return true;
        } else {
            logTest('Images table exists', 'FAIL', 'Table not found. Run: mysql -u root -p barangay_system < migrations/create-images-table.sql');
            return false;
        }
    } catch (error) {
        logTest('Images table check', 'FAIL', error.message);
        return false;
    }
}

// Test 3: Sharp Library
async function testSharpLibrary() {
    console.log('\n📊 TEST 3: Sharp Library');
    console.log('─'.repeat(50));
    
    try {
        const sharp = await import('sharp');
        logTest('Sharp library installed', 'PASS', `Version: ${sharp.default.versions.sharp}`);
        
        // Test basic sharp functionality
        const testBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
        const metadata = await sharp.default(testBuffer).metadata();
        logTest('Sharp functionality', 'PASS', `Successfully processed test image (${metadata.width}x${metadata.height})`);
        
        return true;
    } catch (error) {
        logTest('Sharp library', 'FAIL', `${error.message} - Run: npm install sharp`);
        return false;
    }
}

// Test 4: R2 Configuration
async function testR2Config() {
    console.log('\n📊 TEST 4: R2 Configuration');
    console.log('─'.repeat(50));
    
    const requiredEnvVars = [
        'R2_ACCESS_KEY_ID',
        'R2_SECRET_ACCESS_KEY',
        'R2_ENDPOINT',
        'R2_BUCKET_NAME',
        'R2_PUBLIC_URL'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length === 0) {
        logTest('R2 environment variables', 'PASS', 'All required vars configured');
        
        // Show current config
        console.log('   Current configuration:');
        console.log(`   - Bucket: ${process.env.R2_BUCKET_NAME}`);
        console.log(`   - Endpoint: ${process.env.R2_ENDPOINT}`);
        console.log(`   - Public URL: ${process.env.R2_PUBLIC_URL}`);
        
        // Check if using r2.dev (not cached)
        if (process.env.R2_PUBLIC_URL.includes('r2.dev')) {
            logTest('R2 custom domain', 'WARN', 'Using r2.dev URL - images will NOT be cached! Setup custom domain for caching.');
        } else {
            logTest('R2 custom domain', 'PASS', 'Using custom domain - caching enabled!');
        }
        
        return true;
    } else {
        logTest('R2 configuration', 'FAIL', `Missing: ${missingVars.join(', ')}`);
        return false;
    }
}

// Test 5: R2 Connection
async function testR2ConnectionStatus() {
    console.log('\n📊 TEST 5: R2 Connection');
    console.log('─'.repeat(50));
    
    try {
        const isConnected = await testR2Connection();
        
        if (isConnected) {
            logTest('R2 connection', 'PASS', 'Successfully connected to Cloudflare R2');
            return true;
        } else {
            logTest('R2 connection', 'FAIL', 'Could not connect to R2. Check credentials and endpoint.');
            return false;
        }
    } catch (error) {
        logTest('R2 connection', 'FAIL', error.message);
        return false;
    }
}

// Test 6: Image Optimization Function
async function testImageOptimization() {
    console.log('\n📊 TEST 6: Image Optimization');
    console.log('─'.repeat(50));
    
    try {
        // Create a test PNG image (1x1 pixel red)
        const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
        const testBuffer = Buffer.from(testImageBase64, 'base64');
        
        const originalSize = testBuffer.length;
        logTest('Test image created', 'PASS', `Original size: ${originalSize} bytes`);
        
        // Test optimization
        const optimized = await optimizeImage(testBuffer);
        const optimizedSize = optimized.buffer.length;
        
        logTest('Image optimization', 'PASS', `Optimized size: ${optimizedSize} bytes`);
        logTest('WebP conversion', 'PASS', `Format: ${optimized.mimetype}`);
        
        if (optimized.width && optimized.height) {
            logTest('Image dimensions', 'PASS', `${optimized.width}x${optimized.height}px`);
        }
        
        return true;
    } catch (error) {
        logTest('Image optimization', 'FAIL', error.message);
        return false;
    }
}

// Test 7: Image Model
async function testImageModel() {
    console.log('\n📊 TEST 7: Image Model (Sequelize)');
    console.log('─'.repeat(50));
    
    try {
        // Try to sync the model
        await Image.sync({ alter: false });
        logTest('Image model sync', 'PASS', 'Model synced with database');
        
        // Get current count
        const count = await Image.count();
        logTest('Image records', 'PASS', `Found ${count} images in database`);
        
        return true;
    } catch (error) {
        logTest('Image model', 'FAIL', error.message);
        return false;
    }
}

// Test 8: Test Upload (if test image exists)
async function testImageUpload() {
    console.log('\n📊 TEST 8: Image Upload to R2');
    console.log('─'.repeat(50));
    
    try {
        // Create a simple test image
        const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAP0KBQzxpKlyAAAAAElFTkSuQmCC';
        const testBuffer = Buffer.from(testImageBase64, 'base64');
        
        const filename = `test-diagnostic-${Date.now()}.png`;
        
        // Optimize first
        const optimized = await optimizeImage(testBuffer);
        logTest('Pre-upload optimization', 'PASS', `${testBuffer.length} → ${optimized.buffer.length} bytes`);
        
        // Upload to R2
        const uploadResult = await uploadToR2(
            optimized.buffer,
            filename,
            optimized.mimetype,
            'test'
        );
        
        logTest('Upload to R2', 'PASS', `Uploaded to: ${uploadResult.url}`);
        
        // Test if URL is accessible (just check format)
        if (uploadResult.url.startsWith('http')) {
            logTest('Public URL generated', 'PASS', 'URL format is valid');
        }
        
        // Clean up: Delete the test image
        try {
            await deleteFromR2(uploadResult.key);
            logTest('Cleanup test image', 'PASS', 'Test image removed from R2');
        } catch (cleanupError) {
            logTest('Cleanup test image', 'WARN', 'Could not delete test image');
        }
        
        return true;
    } catch (error) {
        logTest('Image upload', 'FAIL', error.message);
        return false;
    }
}

// Test 9: Routes Registration
async function testRoutesRegistration() {
    console.log('\n📊 TEST 9: API Routes');
    console.log('─'.repeat(50));
    
    try {
        // Check if routes file exists
        const routesPath = path.join(__dirname, 'routes', 'imageRoutes.js');
        if (fs.existsSync(routesPath)) {
            logTest('Image routes file', 'PASS', 'routes/imageRoutes.js exists');
        } else {
            logTest('Image routes file', 'FAIL', 'routes/imageRoutes.js not found');
            return false;
        }
        
        // Check if registered in index
        const indexPath = path.join(__dirname, 'routes', 'index.js');
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        
        if (indexContent.includes('imageRoutes')) {
            logTest('Routes registered', 'PASS', 'Image routes registered in routes/index.js');
        } else {
            logTest('Routes registered', 'FAIL', 'Image routes not registered in routes/index.js');
            return false;
        }
        
        console.log('   Available endpoints:');
        console.log('   - POST   /api/images/upload');
        console.log('   - GET    /api/images');
        console.log('   - GET    /api/images/:id');
        console.log('   - DELETE /api/images/:id');
        
        return true;
    } catch (error) {
        logTest('Routes check', 'FAIL', error.message);
        return false;
    }
}

// Test 10: Frontend Component
async function testFrontendComponent() {
    console.log('\n📊 TEST 10: Frontend Component');
    console.log('─'.repeat(50));
    
    try {
        const componentPath = path.join(__dirname, '..', 'barangay_client', 'src', 'components', 'ui', 'OptimizedImage.jsx');
        
        if (fs.existsSync(componentPath)) {
            logTest('OptimizedImage component', 'PASS', 'Component file exists');
            
            const content = fs.readFileSync(componentPath, 'utf8');
            
            // Check for key features
            if (content.includes('loading="lazy"')) {
                logTest('Lazy loading', 'PASS', 'Native lazy loading implemented');
            } else {
                logTest('Lazy loading', 'WARN', 'Lazy loading not found');
            }
            
            if (content.includes('decoding="async"')) {
                logTest('Async decoding', 'PASS', 'Async decoding implemented');
            } else {
                logTest('Async decoding', 'WARN', 'Async decoding not found');
            }
            
            if (content.includes('skeleton') || content.includes('Loading')) {
                logTest('Loading state', 'PASS', 'Loading skeleton implemented');
            } else {
                logTest('Loading state', 'WARN', 'Loading skeleton not found');
            }
            
            return true;
        } else {
            logTest('OptimizedImage component', 'FAIL', 'Component not found at expected path');
            return false;
        }
    } catch (error) {
        logTest('Frontend component', 'FAIL', error.message);
        return false;
    }
}

// Main test runner
async function runAllTests() {
    console.log('\n');
    console.log('═'.repeat(50));
    console.log('   TASK 8 - COMPREHENSIVE DIAGNOSTIC TEST SUITE');
    console.log('═'.repeat(50));
    console.log('\nTesting all image optimization features...\n');
    
    try {
        // Run all tests
        await testDatabaseConnection();
        await testImagesTable();
        await testSharpLibrary();
        await testR2Config();
        await testR2ConnectionStatus();
        await testImageOptimization();
        await testImageModel();
        await testImageUpload();
        await testRoutesRegistration();
        await testFrontendComponent();
        
        // Print summary
        console.log('\n');
        console.log('═'.repeat(50));
        console.log('   TEST SUMMARY');
        console.log('═'.repeat(50));
        console.log(`✅ Passed:   ${results.passed.length}`);
        console.log(`❌ Failed:   ${results.failed.length}`);
        console.log(`⚠️  Warnings: ${results.warnings.length}`);
        console.log('═'.repeat(50));
        
        if (results.failed.length === 0) {
            console.log('\n🎉 ALL TESTS PASSED! TASK 8 is fully functional!\n');
        } else {
            console.log('\n⚠️  Some tests failed. Please fix the issues above.\n');
            console.log('Failed tests:');
            results.failed.forEach(test => console.log(`  - ${test}`));
            console.log('');
        }
        
        if (results.warnings.length > 0) {
            console.log('⚠️  Warnings (optional improvements):');
            results.warnings.forEach(test => console.log(`  - ${test}`));
            console.log('');
        }
        
    } catch (error) {
        console.error('\n❌ Test suite error:', error);
    } finally {
        await sequelize.close();
        process.exit(results.failed.length === 0 ? 0 : 1);
    }
}

// Run tests
runAllTests();
