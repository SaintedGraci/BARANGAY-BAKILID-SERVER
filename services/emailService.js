import { Resend } from 'resend';
import logger from '../config/logger.js';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Generate 6-digit verification code
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email using Resend API
export const sendVerificationEmail = async (email, code, name) => {
  try {
    // Validate API key
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured in environment variables');
    }

    // Email HTML template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 20px;">
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Barangay Bakilid</h1>
                    <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">Email Verification</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Hello ${name}!</h2>
                    <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                      Thank you for registering with Barangay Bakilid Smart System. To complete your registration and verify your email address, please use the verification code below:
                    </p>
                    
                    <!-- Verification Code -->
                    <div style="background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
                      <p style="color: #666666; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                      <p style="color: #667eea; margin: 0; font-size: 36px; font-weight: bold; letter-spacing: 8px;">${code}</p>
                    </div>
                    
                    <p style="color: #666666; line-height: 1.6; margin: 20px 0; font-size: 14px;">
                      This code will expire in <strong>10 minutes</strong>. If you didn't request this verification, please ignore this email.
                    </p>
                    
                    <!-- Info Box -->
                    <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px;">
                      <p style="color: #1565c0; margin: 0; font-size: 14px; line-height: 1.6;">
                        <strong>Benefits of verifying your email:</strong><br>
                        • Receive instant notifications for document requests<br>
                        • Get updates on barangay announcements<br>
                        • Recover your account if you forget your password
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                    <p style="color: #999999; margin: 0; font-size: 12px; line-height: 1.6;">
                      This is an automated message from Barangay Bakilid Smart System.<br>
                      Please do not reply to this email.
                    </p>
                    <p style="color: #999999; margin: 10px 0 0 0; font-size: 12px;">
                      © ${new Date().getFullYear()} Barangay Bakilid. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Send email via Resend API
    const { data, error } = await resend.emails.send({
      from: 'Barangay Bakilid <onboarding@resend.dev>', // Will change to custom domain later
      to: email,
      subject: 'Email Verification - Barangay Bakilid',
      html: htmlContent
    });

    if (error) {
      logger.error(`Resend API error for ${email}:`, error);
      throw new Error(error.message || 'Failed to send email via Resend');
    }

    logger.info(`✅ Verification email sent to ${email} via Resend (ID: ${data.id})`);
    return { success: true, messageId: data.id };

  } catch (error) {
    logger.error(`Failed to send verification email to ${email}:`, error.message);
    
    // More specific error messages
    if (error.message.includes('RESEND_API_KEY')) {
      throw new Error('Email service not configured. Please contact administrator.');
    } else if (error.message.includes('Invalid')) {
      throw new Error('Invalid email configuration. Please try again later.');
    }
    
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

export default {
  sendVerificationEmail,
  generateVerificationCode
};
