import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api/email-verification';

async function testSendVerificationCode() {
  console.log('Testing: Send Verification Code...\n');
  
  try {
    const response = await fetch(`${API_URL}/send-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@gmail.com',
        name: 'Test User'
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✓ Send verification code successful!');
      return true;
    } else {
      console.log('✗ Send verification code failed!');
      return false;
    }
  } catch (error) {
    console.error('✗ Error testing send code:', error.message);
    return false;
  }
}

async function testVerifyCode(code) {
  console.log('\n\nTesting: Verify Code...\n');
  
  try {
    const response = await fetch(`${API_URL}/verify-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@gmail.com',
        code: code
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✓ Verify code successful!');
      return true;
    } else {
      console.log('✗ Verify code failed!');
      return false;
    }
  } catch (error) {
    console.error('✗ Error testing verify code:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('=== Email Verification API Test ===\n');
  
  // Test 1: Send verification code
  const sendSuccess = await testSendVerificationCode();
  
  if (sendSuccess) {
    console.log('\n⚠️ Check the email for the verification code.');
    console.log('⚠️ Run this script again with the code as argument to test verification:');
    console.log('   node test-email-verification.js [CODE]');
  }
  
  // Test 2: Verify code (if code provided as argument)
  if (process.argv[2]) {
    await testVerifyCode(process.argv[2]);
  }
  
  console.log('\n=== Test Complete ===');
}

runTests();
