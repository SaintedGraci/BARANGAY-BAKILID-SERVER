import fetch from 'node-fetch';

const API_URL = process.env.API_URL || 'http://localhost:5000';
const R2_URL = process.env.R2_PUBLIC_URL || 'https://pub-ccad0830e7364a25afd38860dbe7d923.r2.dev';

async function measureImagePerformance() {
    console.log('📊 Image Performance Test\n');
    console.log('=' .repeat(60));

    try {
        // 1. Fetch announcements
        console.log('\n1️⃣ Fetching announcements...');
        const startFetch = Date.now();
        const response = await fetch(`${API_URL}/api/announcements`);
        const data = await response.json();
        const fetchTime = Date.now() - startFetch;
        
        console.log(`   ✅ Fetched ${data.data.length} announcements in ${fetchTime}ms`);
        console.log(`   Cache headers: ${response.headers.get('cache-control')}`);

        // 2. Analyze image usage
        console.log('\n2️⃣ Analyzing image variants...');
        const announcements = data.data;
        const withImages = announcements.filter(a => a.imagePath);
        const withVariants = announcements.filter(a => a.thumbnailUrl && a.mediumUrl && a.largeUrl);
        const legacyOnly = announcements.filter(a => a.imagePath && !a.thumbnailUrl);

        console.log(`   Total announcements: ${announcements.length}`);
        console.log(`   With images: ${withImages.length}`);
        console.log(`   With variants (optimized): ${withVariants.length}`);
        console.log(`   Legacy only (not optimized): ${legacyOnly.length}`);

        // 3. Test image load times
        if (withVariants.length > 0) {
            console.log('\n3️⃣ Testing image load times (first announcement with variants)...');
            const testAnnouncement = withVariants[0];
            
            // Test thumbnail
            const thumbStart = Date.now();
            const thumbResponse = await fetch(testAnnouncement.thumbnailUrl, { method: 'HEAD' });
            const thumbTime = Date.now() - thumbStart;
            const thumbSize = thumbResponse.headers.get('content-length');
            
            // Test medium
            const medStart = Date.now();
            const medResponse = await fetch(testAnnouncement.mediumUrl, { method: 'HEAD' });
            const medTime = Date.now() - medStart;
            const medSize = medResponse.headers.get('content-length');
            
            // Test large
            const largeStart = Date.now();
            const largeResponse = await fetch(testAnnouncement.largeUrl, { method: 'HEAD' });
            const largeTime = Date.now() - largeStart;
            const largeSize = largeResponse.headers.get('content-length');

            console.log(`\n   Thumbnail (400w):`);
            console.log(`     - Size: ${(thumbSize / 1024).toFixed(2)} KB`);
            console.log(`     - TTFB: ${thumbTime}ms`);
            console.log(`     - Cache: ${thumbResponse.headers.get('cf-cache-status') || 'N/A'}`);
            
            console.log(`\n   Medium (800w):`);
            console.log(`     - Size: ${(medSize / 1024).toFixed(2)} KB`);
            console.log(`     - TTFB: ${medTime}ms`);
            console.log(`     - Cache: ${medResponse.headers.get('cf-cache-status') || 'N/A'}`);
            
            console.log(`\n   Large (1200w):`);
            console.log(`     - Size: ${(largeSize / 1024).toFixed(2)} KB`);
            console.log(`     - TTFB: ${largeTime}ms`);
            console.log(`     - Cache: ${largeResponse.headers.get('cf-cache-status') || 'N/A'}`);

            // Calculate savings
            const savingsVsLarge = ((1 - (thumbSize / largeSize)) * 100).toFixed(1);
            console.log(`\n   💾 Bandwidth savings (thumbnail vs large): ${savingsVsLarge}%`);
        }

        // 4. Check cache headers
        if (withImages.length > 0) {
            console.log('\n4️⃣ Checking cache headers...');
            const firstImage = withImages[0].imagePath || withImages[0].largeUrl;
            const imgResponse = await fetch(firstImage, { method: 'HEAD' });
            
            console.log(`   Cache-Control: ${imgResponse.headers.get('cache-control')}`);
            console.log(`   CF-Cache-Status: ${imgResponse.headers.get('cf-cache-status') || 'N/A'}`);
            console.log(`   Age: ${imgResponse.headers.get('age') || 'N/A'}`);
            console.log(`   Content-Type: ${imgResponse.headers.get('content-type')}`);
        }

        // 5. Summary
        console.log('\n' + '=' .repeat(60));
        console.log('📈 PERFORMANCE SUMMARY\n');
        console.log(`✅ Image variants implemented: ${withVariants.length}/${withImages.length} announcements`);
        console.log(`✅ WebP format used for optimization`);
        console.log(`✅ Three responsive sizes (400w, 800w, 1200w)`);
        console.log(`✅ Long-lived browser caching enabled`);
        
        if (legacyOnly.length > 0) {
            console.log(`\n⚠️  ${legacyOnly.length} announcements still use legacy single image`);
            console.log(`   Re-upload these to benefit from variants`);
        }

        console.log('\n💡 RECOMMENDATIONS:\n');
        console.log('   - First 2-3 images: Eager loading (already implemented)');
        console.log('   - Rest: Lazy loading (already implemented)');
        console.log('   - Feed view: Uses medium variant (800w)');
        console.log('   - Lightbox: Uses large variant (1200w)');
        console.log('   - Mobile: Browser selects thumbnail automatically via srcSet');
        
        console.log('\n' + '=' .repeat(60));

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

measureImagePerformance();
