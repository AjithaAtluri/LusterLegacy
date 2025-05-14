import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable is not set. Email functionality will be disabled.");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

// Default configuration values
const DEFAULT_SENDER_NAME = 'Luster Legacy';
const DEFAULT_SENDER_EMAIL = 'noreply@lusterlegacy.com';

// Use verified sender email from environment variable if available
const VERIFIED_SENDER_EMAIL = process.env.VERIFIED_SENDER_EMAIL || DEFAULT_SENDER_EMAIL;

interface EmailData {
  to: string;
  subject: string;
  text?: string;
  html: string;
  from?: string;
}

/**
 * Send an email using SendGrid
 */
export async function sendEmail(data: EmailData): Promise<{ success: boolean; message?: string }> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.log("Email would be sent in production. Email data:", data);
      return { 
        success: true, 
        message: "Email sending simulated (no API key)" 
      };
    }
    
    // Format sender with name and email
    const sender = data.from || `${DEFAULT_SENDER_NAME} <${VERIFIED_SENDER_EMAIL}>`;
    
    console.log(`Attempting to send email from: ${sender} to: ${data.to}`);
    
    // In development/test mode, log email content but don't actually send
    if (process.env.NODE_ENV === 'development' && !process.env.SEND_REAL_EMAILS) {
      console.log('Development mode - not sending real email. Would send:');
      console.log(`From: ${sender}`);
      console.log(`To: ${data.to}`);
      console.log(`Subject: ${data.subject}`);
      console.log('Text:', data.text);
      console.log('HTML:', data.html?.substring(0, 100) + '...');
      
      return { 
        success: true, 
        message: "Email sending simulated (development mode)" 
      };
    }
    
    await mailService.send({
      to: data.to,
      from: sender,
      subject: data.subject,
      text: data.text,
      html: data.html,
    });
    
    console.log(`Email sent successfully to ${data.to}`);
    return { success: true };
  } catch (error) {
    console.error('SendGrid email error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown email error'
    };
  }
}

/**
 * Send a verification email
 */
export async function sendVerificationEmail(
  email: string, 
  name: string | null,
  verificationLink: string
): Promise<{ success: boolean; message?: string }> {
  const displayName = name || 'Valued Customer';
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #F5F5F5; padding: 20px; text-align: center; border-bottom: 3px solid #D4AF37;">
        <h1 style="color: #333; margin: 0;">Luster Legacy</h1>
      </div>
      <div style="padding: 20px; background-color: #ffffff; border: 1px solid #e0e0e0;">
        <h2 style="color: #333;">Verify Your Email</h2>
        <p>Hello ${displayName},</p>
        <p>Thank you for creating an account with Luster Legacy. Please verify your email address to access all features of your account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #D4AF37; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email Address</a>
        </div>
        <p style="margin-top: 30px;">If you did not create an account, please ignore this email.</p>
        <p>If the button above doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; font-size: 14px;">${verificationLink}</p>
      </div>
      <div style="padding: 15px; background-color: #333333; color: #ffffff; text-align: center; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Luster Legacy. All rights reserved.</p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject: 'Verify Your Email - Luster Legacy',
    html: emailHtml,
    text: `Hello ${displayName}, please verify your email by visiting: ${verificationLink}`
  });
}

/**
 * Send password reset email with a reset link
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string | null,
  resetLink: string
): Promise<{ success: boolean; message?: string }> {
  const displayName = name || 'Valued Customer';
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #F5F5F5; padding: 20px; text-align: center; border-bottom: 3px solid #D4AF37;">
        <h1 style="color: #333; margin: 0;">Luster Legacy</h1>
      </div>
      <div style="padding: 20px; background-color: #ffffff; border: 1px solid #e0e0e0;">
        <h2 style="color: #333;">Reset Your Password</h2>
        <p>Hello ${displayName},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #D4AF37; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="margin-top: 30px;">If you did not request a password reset, please ignore this email or contact us if you have concerns.</p>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If the button above doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; font-size: 14px;">${resetLink}</p>
      </div>
      <div style="padding: 15px; background-color: #333333; color: #ffffff; text-align: center; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Luster Legacy. All rights reserved.</p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject: 'Password Reset - Luster Legacy',
    html: emailHtml,
    text: `Hello ${displayName}, we received a request to reset your password. Please visit this link to reset your password: ${resetLink}. This link will expire in 1 hour.`
  });
}

/**
 * Send password change confirmation email
 */
export async function sendPasswordChangeEmail(
  email: string, 
  name: string | null
): Promise<{ success: boolean; message?: string }> {
  const displayName = name || 'Valued Customer';
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #F5F5F5; padding: 20px; text-align: center; border-bottom: 3px solid #D4AF37;">
        <h1 style="color: #333; margin: 0;">Luster Legacy</h1>
      </div>
      <div style="padding: 20px; background-color: #ffffff; border: 1px solid #e0e0e0;">
        <h2 style="color: #333;">Password Changed</h2>
        <p>Hello ${displayName},</p>
        <p>Your password has been successfully changed. If you did not initiate this change, please contact us immediately.</p>
        <p style="margin-top: 30px;">Thank you for shopping with Luster Legacy.</p>
      </div>
      <div style="padding: 15px; background-color: #333333; color: #ffffff; text-align: center; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Luster Legacy. All rights reserved.</p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject: 'Password Changed - Luster Legacy',
    html: emailHtml,
    text: `Hello ${displayName}, your password has been successfully changed. If you did not initiate this change, please contact us immediately.`
  });
}