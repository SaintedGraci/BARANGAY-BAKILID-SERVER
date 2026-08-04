import dotenv from 'dotenv';
import { sendVerificationEmail, generateVerificationCode } from './services/emailService.js';

// Load environment variables
dotenv.config();

async function testEmail() {
  console.log('=== Testing Email Service ===\n');
  
  try {
    console.log('1. Generating verification code...');
    const code = generateVerificationCode();
    console.log(`   Generated code: ${code}\n`);
    
    console.log('2. Attempting to send email...');
    console.log('   Email: test@example.com');
    console.log('   Name: Test User\n');
    
    const result = await sendVerificationEmail('test@example.com', code, 'Test User');
    
    console.log('✓ Email sent successfully!');
    console.log('   Message ID:', result.messageId);
    console.log('\n=== Test Successful ===');
  } catch (error) {
    console.error('✗ Email sending failed!');
    console.error('   Error:', error.message);
    console.error('\n=== Test Failed ===');
    
    if (error.message.includes('Email authentication failed')) {
      console.error('\n⚠️ Gmail Authentication Issue:');
      console.error('   The Gmail App Password is invalid or expired.');
      console.error('   To fix this:');
      console.error('   1. Go to: https://myaccount.google.com/security');
      console.error('   2. Enable 2-Step Verification if not enabled');
      console.error('   3. Go to: https://myaccount.google.com/apppasswords');
      console.error('   4. Generate a new App Password for "Mail"');
      console.error('   5. Update EMAIL_APP_PASSWORD in .env file');
      console.error('   6. Restart the server');
    }
  }
}

testEmail();
