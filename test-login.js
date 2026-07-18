import { loginUser } from './services/authServices.js';

async function testLogin() {
    console.log('Testing login with maria.santos@email.com...');
    
    const result = await loginUser('maria.santos@email.com', 'resident123');
    
    if (result.success) {
        console.log('✅ LOGIN SUCCESSFUL!');
        console.log('Token:', result.token);
        console.log('User:', JSON.stringify(result.user, null, 2));
    } else {
        console.log('❌ LOGIN FAILED');
        console.log('Message:', result.message);
    }
    
    process.exit(0);
}

testLogin();
