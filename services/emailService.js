import { Resend } from 'resend';
import logger from '../config/logger.js';

// Lazy initialize Resend client
let resend = null;
const getResendClient = () => {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured in environment variables');
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

// Generate 6-digit verification code
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email using Resend API
export const sendVerificationEmail = async (email, code, name) => {
  try {
    // Get Resend client (lazy initialization)
    const resendClient = getResendClient();

    // Email HTML template - Vercel-style with Government Green
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Email Verification</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif; background-color: #fafafa; -webkit-font-smoothing: antialiased;">
        <!-- Main Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fafafa; padding: 40px 20px;">
          <tr>
            <td align="center">
              <!-- Email Card -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
                
                <!-- Government Header -->
                <tr>
                  <td style="background-color: #000000; padding: 32px 32px 24px 32px; border-bottom: 3px solid #10b981;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td>
                          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">Republic of the Philippines</h1>
                          <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0 0; font-size: 14px; font-weight: 400;">Barangay Bakilid, Mandaue City</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Verification Badge -->
                <tr>
                  <td style="padding: 32px 32px 0 32px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: #10b981; border-radius: 6px; padding: 6px 12px;">
                          <span style="color: #ffffff; font-size: 13px; font-weight: 500; letter-spacing: 0.3px;">📧 EMAIL VERIFICATION</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Main Content -->
                <tr>
                  <td style="padding: 24px 32px 32px 32px;">
                    <h2 style="color: #000000; margin: 0 0 16px 0; font-size: 28px; font-weight: 600; line-height: 1.2; letter-spacing: -0.7px;">Verify your email</h2>
                    <p style="color: #525252; line-height: 1.6; margin: 0 0 28px 0; font-size: 16px;">
                      Hello <strong style="color: #000000;">${name}</strong>,
                    </p>
                    <p style="color: #525252; line-height: 1.6; margin: 0 0 32px 0; font-size: 16px;">
                      Thank you for registering with Barangay Bakilid Smart System. To complete your registration, please enter the verification code below:
                    </p>

                    <!-- Verification Code Card -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 2px solid #10b981; border-radius: 12px; margin-bottom: 32px;">
                      <tr>
                        <td style="padding: 32px; text-align: center;">
                          <p style="color: #065f46; margin: 0 0 12px 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.2px;">Your Verification Code</p>
                          <p style="color: #047857; margin: 0; font-size: 42px; font-weight: 700; letter-spacing: 12px; font-family: 'Courier New', monospace;">${code}</p>
                          <p style="color: #059669; margin: 12px 0 0 0; font-size: 13px; font-weight: 500;">Expires in 10 minutes</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Benefits Card -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fafafa; border: 1px solid #e5e5e5; border-radius: 8px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 20px;">
                          <p style="color: #737373; margin: 0 0 16px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px;">Benefits of Verification</p>
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="padding: 8px 0;">
                                <p style="color: #525252; margin: 0; font-size: 14px; line-height: 1.6;">
                                  ✓ Receive instant notifications for document requests
                                </p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0;">
                                <p style="color: #525252; margin: 0; font-size: 14px; line-height: 1.6;">
                                  ✓ Get updates on barangay announcements
                                </p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0;">
                                <p style="color: #525252; margin: 0; font-size: 14px; line-height: 1.6;">
                                  ✓ Recover your account if you forget your password
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Security Notice -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fef3c7; border-left: 3px solid #f59e0b; border-radius: 6px;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <p style="color: #92400e; margin: 0; font-size: 13px; line-height: 1.6;">
                            <strong style="font-weight: 600;">Security Note:</strong> If you didn't request this verification, please ignore this email. Your account will remain unverified and inactive.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #fafafa; padding: 24px 32px; border-top: 1px solid #e5e5e5;">
                    <p style="color: #a3a3a3; margin: 0 0 8px 0; font-size: 12px; line-height: 1.5;">
                      This is an automated notification from Barangay Bakilid Smart System. Please do not reply to this email.
                    </p>
                    <p style="color: #a3a3a3; margin: 0; font-size: 12px;">
                      © ${new Date().getFullYear()} Barangay Bakilid. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Branding Footer -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; margin-top: 24px;">
                <tr>
                  <td align="center" style="padding: 0 20px;">
                    <p style="color: #a3a3a3; margin: 0; font-size: 11px; line-height: 1.5;">
                      Powered by Barangay Bakilid Smart System
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
    const { data, error } = await resendClient.emails.send({
      from: process.env.EMAIL_FROM || 'Barangay Bakilid <noreply@bakilidgov.vercel.app>', // Will change to custom domain later
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

// Send pickup notification email with modern Vercel-style + government template
export const sendPickupNotificationEmail = async (email, data) => {
  try {
    const resendClient = getResendClient();

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Document Ready for Pickup</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif; background-color: #fafafa; -webkit-font-smoothing: antialiased;">
        <!-- Main Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fafafa; padding: 40px 20px;">
          <tr>
            <td align="center">
              <!-- Email Card -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
                
                <!-- Government Header -->
                <tr>
                  <td style="background-color: #000000; padding: 32px 32px 24px 32px; border-bottom: 3px solid #0070f3;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td>
                          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">Republic of the Philippines</h1>
                          <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0 0; font-size: 14px; font-weight: 400;">Barangay Bakilid, Mandaue City</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Success Badge -->
                <tr>
                  <td style="padding: 32px 32px 0 32px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: #10b981; border-radius: 6px; padding: 6px 12px;">
                          <span style="color: #ffffff; font-size: 13px; font-weight: 500; letter-spacing: 0.3px;">✓ READY FOR PICKUP</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Main Content -->
                <tr>
                  <td style="padding: 24px 32px 32px 32px;">
                    <h2 style="color: #000000; margin: 0 0 16px 0; font-size: 28px; font-weight: 600; line-height: 1.2; letter-spacing: -0.7px;">Your document is ready</h2>
                    <p style="color: #525252; line-height: 1.6; margin: 0 0 28px 0; font-size: 16px;">
                      Hello <strong style="color: #000000;">${data.residentName}</strong>,
                    </p>
                    <p style="color: #525252; line-height: 1.6; margin: 0 0 32px 0; font-size: 16px;">
                      Your requested document has been processed and is now available for pickup at the Barangay Office. Please review the details below.
                    </p>

                    <!-- Document Details Card -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fafafa; border: 1px solid #e5e5e5; border-radius: 8px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 20px;">
                          <p style="color: #737373; margin: 0 0 16px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px;">Document Details</p>
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e5;">
                                <span style="color: #737373; font-size: 14px;">Document Type</span>
                              </td>
                              <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">
                                <span style="color: #000000; font-size: 14px; font-weight: 600;">${data.documentType}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e5;">
                                <span style="color: #737373; font-size: 14px;">Reference Number</span>
                              </td>
                              <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">
                                <span style="color: #000000; font-size: 14px; font-weight: 600; font-family: 'Courier New', monospace;">#${data.requestId}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0;">
                                <span style="color: #737373; font-size: 14px;">Request Date</span>
                              </td>
                              <td style="padding: 10px 0; text-align: right;">
                                <span style="color: #000000; font-size: 14px; font-weight: 600;">${data.requestDate}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Pickup Information Card -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #93c5fd; border-radius: 8px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 20px;">
                          <p style="color: #1e40af; margin: 0 0 16px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px;">Pickup Information</p>
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="padding: 6px 0;">
                                <p style="color: #1e3a8a; margin: 0; font-size: 14px; line-height: 1.6;">
                                  <strong style="font-weight: 600;">Location:</strong><br>
                                  ${data.pickupLocation}
                                </p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 6px 0;">
                                <p style="color: #1e3a8a; margin: 0; font-size: 14px; line-height: 1.6;">
                                  <strong style="font-weight: 600;">Office Hours:</strong><br>
                                  ${data.officeHours}
                                </p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 6px 0;">
                                <p style="color: #1e3a8a; margin: 0; font-size: 14px; line-height: 1.6;">
                                  <strong style="font-weight: 600;">What to Bring:</strong><br>
                                  Valid government-issued ID and reference number
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Important Notice -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fef3c7; border-left: 3px solid #f59e0b; border-radius: 6px;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <p style="color: #92400e; margin: 0; font-size: 13px; line-height: 1.6;">
                            <strong style="font-weight: 600;">Important:</strong> Please claim your document within <strong>30 days</strong> to avoid forfeiture. A valid government-issued ID is required for pickup.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #fafafa; padding: 24px 32px; border-top: 1px solid #e5e5e5;">
                    <p style="color: #a3a3a3; margin: 0 0 8px 0; font-size: 12px; line-height: 1.5;">
                      This is an automated notification from Barangay Bakilid Smart System. Please do not reply to this email.
                    </p>
                    <p style="color: #a3a3a3; margin: 0; font-size: 12px;">
                      © ${new Date().getFullYear()} Barangay Bakilid. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Branding Footer -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; margin-top: 24px;">
                <tr>
                  <td align="center" style="padding: 0 20px;">
                    <p style="color: #a3a3a3; margin: 0; font-size: 11px; line-height: 1.5;">
                      Powered by Barangay Bakilid Smart System
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

    const { data: result, error } = await resendClient.emails.send({
      from: process.env.EMAIL_FROM || 'Barangay Bakilid <noreply@bakilidgov.vercel.app>',
      to: email,
      subject: `Your ${data.documentType} is Ready for Pickup - Barangay Bakilid`,
      html: htmlContent
    });

    if (error) {
      logger.error(`Resend API error for pickup notification ${email}:`, error);
      throw new Error(error.message || 'Failed to send pickup notification email via Resend');
    }

    logger.info(`✅ Pickup notification email sent to ${email} via Resend (ID: ${result.id})`);
    return { success: true, messageId: result.id };

  } catch (error) {
    logger.error(`Failed to send pickup notification email to ${email}:`, error.message);
    throw new Error(`Failed to send pickup notification email: ${error.message}`);
  }
};

export default {
  sendVerificationEmail,
  generateVerificationCode,
  sendPickupNotificationEmail
};


// Send password reset email with modern Vercel-style + government template
export const sendPasswordResetEmail = async (email, data) => {
  try {
    const resendClient = getResendClient();

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Password Reset Request</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif; background-color: #fafafa; -webkit-font-smoothing: antialiased;">
        <!-- Main Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fafafa; padding: 40px 20px;">
          <tr>
            <td align="center">
              <!-- Email Card -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
                
                <!-- Government Header -->
                <tr>
                  <td style="background-color: #000000; padding: 32px 32px 24px 32px; border-bottom: 3px solid #10b981;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td>
                          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">Republic of the Philippines</h1>
                          <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0 0; font-size: 14px; font-weight: 400;">Barangay Bakilid, Mandaue City</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Badge -->
                <tr>
                  <td style="padding: 32px 32px 0 32px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: #f59e0b; border-radius: 6px; padding: 6px 12px;">
                          <span style="color: #ffffff; font-size: 13px; font-weight: 500; letter-spacing: 0.3px;">🔐 PASSWORD RESET</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Main Content -->
                <tr>
                  <td style="padding: 24px 32px 32px 32px;">
                    <h2 style="color: #000000; margin: 0 0 16px 0; font-size: 28px; font-weight: 600; line-height: 1.2; letter-spacing: -0.7px;">Reset your password</h2>
                    <p style="color: #525252; line-height: 1.6; margin: 0 0 28px 0; font-size: 16px;">
                      Hello <strong style="color: #000000;">${data.name}</strong>,
                    </p>
                    <p style="color: #525252; line-height: 1.6; margin: 0 0 32px 0; font-size: 16px;">
                      We received a request to reset the password for your Barangay Bakilid account. Click the button below to create a new password.
                    </p>

                    <!-- Reset Button -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 32px;">
                      <tr>
                        <td align="center">
                          <a href="${data.resetUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(16,185,129,0.3);">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Alternative Link -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fafafa; border: 1px solid #e5e5e5; border-radius: 8px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <p style="color: #737373; margin: 0 0 8px 0; font-size: 12px; font-weight: 600;">Or copy and paste this link:</p>
                          <p style="color: #525252; margin: 0; font-size: 13px; word-break: break-all; font-family: 'Courier New', monospace;">
                            ${data.resetUrl}
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Expiration Notice -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fef3c7; border-left: 3px solid #f59e0b; border-radius: 6px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <p style="color: #92400e; margin: 0; font-size: 13px; line-height: 1.6;">
                            <strong style="font-weight: 600;">Expires in ${data.expiresInMinutes} minutes:</strong> This password reset link will expire automatically for your security.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Security Warning -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fee2e2; border-left: 3px solid #ef4444; border-radius: 6px;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <p style="color: #991b1b; margin: 0; font-size: 13px; line-height: 1.6;">
                            <strong style="font-weight: 600;">Security Notice:</strong> If you did not request a password reset, please ignore this email or contact the barangay office immediately. Your account remains secure.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #fafafa; padding: 24px 32px; border-top: 1px solid #e5e5e5;">
                    <p style="color: #a3a3a3; margin: 0 0 8px 0; font-size: 12px; line-height: 1.5;">
                      This is an automated notification from Barangay Bakilid Smart System. Please do not reply to this email.
                    </p>
                    <p style="color: #a3a3a3; margin: 0; font-size: 12px;">
                      © ${new Date().getFullYear()} Barangay Bakilid. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Branding Footer -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; margin-top: 24px;">
                <tr>
                  <td align="center" style="padding: 0 20px;">
                    <p style="color: #a3a3a3; margin: 0; font-size: 11px; line-height: 1.5;">
                      Powered by Barangay Bakilid Smart System
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

    const { data: result, error } = await resendClient.emails.send({
      from: process.env.EMAIL_FROM || 'Barangay Bakilid <noreply@barangaybakilid.com>',
      to: email,
      subject: 'Password Reset Request - Barangay Bakilid',
      html: htmlContent
    });

    if (error) {
      logger.error(`Resend API error for password reset ${email}:`, error);
      throw new Error(error.message || 'Failed to send password reset email via Resend');
    }

    logger.info(`✅ Password reset email sent to ${email} via Resend (ID: ${result.id})`);
    return { success: true, messageId: result.id };

  } catch (error) {
    logger.error(`Failed to send password reset email to ${email}:`, error.message);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};
