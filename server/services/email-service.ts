import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable is not set. Email functionality will be disabled.");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

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
    
    await mailService.send({
      to: data.to,
      from: data.from || 'noreply@lusterlegacy.com',
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