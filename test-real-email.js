import dotenv from 'dotenv';
import { sendVerificationEmail, generateVerificationCode } from './services/emailService.js';

// Load environment variables
dotenv.config();

async function testRealEmail() {
  console.log('=== Testing Real Email Verification ===\n');
  
  try {
    const testEmail = 'subrosaaa01@gmail.com'; // Your own email to test
    const code = generateVerificationCode();
    
    console.log(`Sending verification email to: ${testEmail}`);
    console.log(`Verification code: ${code}\n`);
    
    const result = await sendVerificationEmail(testEmail, code, 'Test User');
    
    console.log('✓ Email sent successfully!');
    console.log(`Check ${testEmail} inbox for the verification email.`);
    console.log('\n=== Test Successful ===');
  } catch (error) {
    console.error('✗ Failed:', error.message);
  }
}

testRealEmail();
