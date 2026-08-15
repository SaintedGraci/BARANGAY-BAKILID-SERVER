import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
const testImageUrl = 'https://pub-ccad0830e7364a25afd38860dbe7d923.r2.dev/announcements/1786782280885-081211b41591f5a3-large.webp';

async function testR2Access() {
    console.log('🔍 TESTING R2 ACCESS\n');
    console.log('=' .repeat(60));
    
    console.log('\n📌 Configuration:');
    console.log(`   R2_PUBLIC_URL: ${R2_PUBLIC_URL}`);
    console.log(`   Test Image: ${testImageUrl}`);
    
    console.log('\n🌐 Testing direct HTTP access...');
    try {
        const response = await fetch(testImageUrl, {
            method: 'HEAD',
            headers: {
                'User-Agent': 'Barangay-System-Test/1.0'
            }
        });
        
        console.log(`   Status: ${response.status} ${response.statusText}`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}`);
        console.log(`   Content-Length: ${response.headers.get('content-length')} bytes`);
        console.log(`   Access-Control-Allow-Origin: ${response.headers.get('access-control-allow-origin') || 'NOT SET'}`);
        console.log(`   Cache-Control: ${response.headers.get('cache-control') || 'NOT SET'}`);
        
        if (response.status === 200) {
            console.log('\n   ✅ Image is accessible from R2!');
        } else if (response.status === 403) {
            console.log('\n   ❌ Access Denied - R2 bucket might not be public');
        } else if (response.status === 404) {
            console.log('\n   ❌ Image not found - check if upload succeeded');
        }
        
        if (!response.headers.get('access-control-allow-origin')) {
            console.log('\n   ⚠️  WARNING: CORS headers not set!');
            console.log('   This will cause images to fail loading in browsers.');
        }
        
    } catch (error) {
        console.error('   ❌ Error:', error.message);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📋 DIAGNOSIS:');
    console.log('   If status is 403: Make R2 bucket public');
    console.log('   If CORS not set: Configure CORS in Cloudflare dashboard');
    console.log('\n💡 FIX INSTRUCTIONS:');
    console.log('   1. Go to Cloudflare Dashboard → R2');
    console.log('   2. Select bucket: barangay-bakilid-documents');
    console.log('   3. Go to Settings → CORS Policy');
    console.log('   4. Add this CORS policy:');
    console.log('\n   [');
    console.log('     {');
    console.log('       "AllowedOrigins": ["*"],');
    console.log('       "AllowedMethods": ["GET", "HEAD"],');
    console.log('       "AllowedHeaders": ["*"],');
    console.log('       "MaxAgeSeconds": 3600');
    console.log('     }');
    console.log('   ]');
    console.log('\n   5. Make sure bucket has Public Access enabled');
    console.log('\n' + '='.repeat(60));
}

testR2Access();
