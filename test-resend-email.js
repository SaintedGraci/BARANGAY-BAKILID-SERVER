import dotenv from 'dotenv';
import { sendVerificationEmail } from './services/emailService.js';

// Load environment variables
dotenv.config();

async function testResendEmail() {
  console.log('🧪 Testing Resend Email Service...\n');
  
  // Check if API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in .env file!');
    console.log('\n📝 To fix:');
    console.log('1. Get API key from: https://resend.com/api-keys');
    console.log('2. Add to .env: RESEND_API_KEY=re_your_key_here');
    process.exit(1);
  }
  
  console.log('✅ RESEND_API_KEY found');
  console.log(`   Key preview: ${process.env.RESEND_API_KEY.substring(0, 10)}...`);
  
  // Test email details
  const testEmail = process.argv[2] || 'test@example.com';
  const testCode = '123456';
  const testName = 'Test User';
  
  console.log(`\n📧 Sending test email to: ${testEmail}`);
  console.log(`   Verification code: ${testCode}`);
  console.log(`   Recipient name: ${testName}`);
  
  try {
    const result = await sendVerificationEmail(testEmail, testCode, testName);
    
    console.log('\n✅ Email sent successfully!');
    console.log(`   Message ID: ${result.messageId}`);
    console.log('\n📬 Check your inbox (and spam folder)');
    console.log(`   View logs: https://resend.com/logs`);
    
  } catch (error) {
    console.error('\n❌ Failed to send email:');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('API key')) {
      console.log('\n💡 Troubleshooting:');
      console.log('1. Verify API key is correct in .env');
      console.log('2. Get new key: https://resend.com/api-keys');
      console.log('3. Check for extra spaces in RESEND_API_KEY value');
    } else if (error.message.includes('domain')) {
      console.log('\n💡 Note:');
      console.log('Using default onboarding@resend.dev domain');
      console.log('Email will show "via resend.dev" - this is normal for free tier');
    }
    
    process.exit(1);
  }
}

// Show usage if no email provided
if (process.argv.length < 3) {
  console.log('Usage: node test-resend-email.js <your-email@gmail.com>');
  console.log('Example: node test-resend-email.js johnmarvinsalazar26@gmail.com');
  console.log('\nUsing default test email: test@example.com\n');
}

testResendEmail();
