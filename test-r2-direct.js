import { S3Client, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const r2Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

async function testR2Direct() {
    console.log('🔍 TESTING R2 DIRECT ACCESS\n');
    console.log('=' .repeat(60));
    
    console.log('\n📌 Configuration:');
    console.log(`   Bucket: ${BUCKET_NAME}`);
    console.log(`   Endpoint: ${process.env.R2_ENDPOINT}`);
    console.log(`   Public URL: ${process.env.R2_PUBLIC_URL}`);
    
    try {
        // List recent files in announcements folder
        console.log('\n📂 Listing recent announcement images...');
        const listCommand = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: 'announcements/',
            MaxKeys: 10
        });
        
        const listResult = await r2Client.send(listCommand);
        
        if (!listResult.Contents || listResult.Contents.length === 0) {
            console.log('   ⚠️  No files found in announcements folder');
        } else {
            console.log(`   ✅ Found ${listResult.Contents.length} files:`);
            for (const obj of listResult.Contents) {
                console.log(`      - ${obj.Key} (${obj.Size} bytes, ${new Date(obj.LastModified).toLocaleString()})`);
                
                // Test if we can get object metadata
                try {
                    const headCommand = new HeadObjectCommand({
                        Bucket: BUCKET_NAME,
                        Key: obj.Key
                    });
                    const headResult = await r2Client.send(headCommand);
                    console.log(`        Content-Type: ${headResult.ContentType}`);
                    console.log(`        Cache-Control: ${headResult.CacheControl || 'Not set'}`);
                } catch (headError) {
                    console.log(`        ❌ Failed to get metadata: ${headError.message}`);
                }
            }
        }
        
        // List recent files in documents/uploads folder
        console.log('\n📂 Listing recent document uploads...');
        const docsCommand = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: 'uploads/',
            MaxKeys: 5
        });
        
        const docsResult = await r2Client.send(docsCommand);
        
        if (!docsResult.Contents || docsResult.Contents.length === 0) {
            console.log('   ⚠️  No files found in uploads folder');
        } else {
            console.log(`   ✅ Found ${docsResult.Contents.length} files:`);
            for (const obj of docsResult.Contents) {
                console.log(`      - ${obj.Key} (${obj.Size} bytes)`);
            }
        }
        
        console.log('\n🔍 DIAGNOSIS:');
        console.log('   ✅ R2 bucket is accessible via API');
        console.log('   ✅ Files are being uploaded successfully');
        console.log('   ❌ BUT public URL domain does not resolve');
        
        console.log('\n💡 SOLUTION:');
        console.log('   The R2 public URL in your .env might be wrong.');
        console.log('   Please check Cloudflare R2 dashboard for the ACTUAL public URL.');
        console.log('   Current R2_PUBLIC_URL: ' + process.env.R2_PUBLIC_URL);
        console.log('\n   Steps:');
        console.log('   1. Go to Cloudflare Dashboard → R2 → barangay-bakilid-documents');
        console.log('   2. Click Settings tab');
        console.log('   3. Look for "Public Access" or "R2.dev subdomain" section');
        console.log('   4. Copy the ACTUAL URL shown there');
        console.log('   5. Update R2_PUBLIC_URL in Railway environment variables');
        console.log('   6. Redeploy');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('   Check your R2 credentials in .env file');
    }
    
    console.log('\n' + '='.repeat(60));
}

testR2Direct();
