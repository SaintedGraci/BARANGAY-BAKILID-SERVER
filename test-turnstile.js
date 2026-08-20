import 'dotenv/config';

console.log('=== Cloudflare Turnstile Configuration Test ===\n');

// Check environment variables
console.log('1. Environment Variables:');
console.log('   TURNSTILE_SECRET_KEY:', process.env.TURNSTILE_SECRET_KEY ? '✓ Set' : '✗ Missing');
console.log('   Value:', process.env.TURNSTILE_SECRET_KEY ? `${process.env.TURNSTILE_SECRET_KEY.substring(0, 10)}...` : 'Not set');

// Test Turnstile verification endpoint
async function testTurnstileVerification() {
    console.log('\n2. Testing Cloudflare Turnstile API:');
    
    const testToken = '1x0000000000000000000000000000000AA'; // Test token that always passes
    const turnstileVerifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    
    const formData = new URLSearchParams();
    formData.append('secret', process.env.TURNSTILE_SECRET_KEY);
    formData.append('response', testToken);
    
    try {
        const response = await fetch(turnstileVerifyUrl, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        
        const result = await response.json();
        console.log('   API Response:', JSON.stringify(result, null, 2));
        
        if (result.success) {
            console.log('   ✓ Turnstile API is working correctly');
        } else {
            console.log('   ✗ Turnstile verification failed');
            console.log('   Error codes:', result['error-codes']);
        }
    } catch (error) {
        console.log('   ✗ Error connecting to Turnstile API:', error.message);
    }
}

testTurnstileVerification();
