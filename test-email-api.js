import axios from 'axios';

const API_URL = 'http://localhost:5000/api/email-verification';

async function testEmailAPI() {
  console.log('🧪 Testing Email Verification API\n');

  // Test 1: Send verification code
  console.log('Test 1: Send verification code');
  try {
    const response = await axios.post(`${API_URL}/send-code`, {
      email: 'test@gmail.com',
      name: 'Test User'
    });
    console.log('✅ Send code response:', response.data);
  } catch (error) {
    console.log('❌ Send code error:', error.response?.data || error.message);
  }

  console.log('\n---\n');

  // Test 2: Verify code (with wrong code)
  console.log('Test 2: Verify code (wrong code)');
  try {
    const response = await axios.post(`${API_URL}/verify-code`, {
      email: 'test@gmail.com',
      code: '000000'
    });
    console.log('✅ Verify response:', response.data);
  } catch (error) {
    console.log('❌ Verify error:', error.response?.data || error.message);
  }

  console.log('\n---\n');

  // Test 3: Validation - missing email
  console.log('Test 3: Validation - missing email');
  try {
    const response = await axios.post(`${API_URL}/send-code`, {
      name: 'Test User'
    });
    console.log('✅ Response:', response.data);
  } catch (error) {
    console.log('❌ Expected error:', error.response?.data || error.message);
  }

  console.log('\n✅ API tests complete!');
}

testEmailAPI().catch(console.error);
