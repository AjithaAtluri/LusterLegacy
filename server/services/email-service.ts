import { MailService } from '@sendgrid/mail';

// Check for required environment variables for email functionality
if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable is not set. Email functionality will be disabled.");
}

if (!process.env.VERIFIED_SENDER_EMAIL) {
  console.warn("VERIFIED_SENDER_EMAIL environment variable is not set. Using default sender email.");
}

// Initialize SendGrid mail service
const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
  console.log("SendGrid API configured successfully with provided API key");
}

// Default configuration values
const DEFAULT_SENDER_NAME = 'Luster Legacy';
const DEFAULT_SENDER_EMAIL = 'admin@lusterlegacy.com'; // Changed default email

// Use verified sender email from environment variable if available
const VERIFIED_SENDER_EMAIL = process.env.VERIFIED_SENDER_EMAIL || DEFAULT_SENDER_EMAIL;

console.log(`Email service initialized with sender: ${DEFAULT_SENDER_NAME} <${VERIFIED_SENDER_EMAIL}>`);

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
    
    // Validate and fix email URLs in links
    if (process.env.NODE_ENV === 'production' && data.html) {
      // Check for development URLs in production emails
      const devUrlPattern = /(https?:\/\/localhost:[0-9]+|https?:\/\/[^\/\s"'<>]+:[0-9]+)/g;
      const hasDevUrls = devUrlPattern.test(data.html);
      
      if (hasDevUrls) {
        console.warn('WARNING: Production email contains localhost or port references - attempting to fix:');
        
        // Get the production domain from environment or use lusterlegacy.co as default
        const productionDomain = process.env.PRODUCTION_DOMAIN || 'lusterlegacy.co';
        
        // Replace development URLs with production domain
        let fixedHtml = data.html;
        
        // First, fix localhost URLs
        fixedHtml = fixedHtml.replace(
          /(https?:\/\/)localhost(:[0-9]+)?(\S*)/g, 
          `https://${productionDomain}$3`
        );
        
        // Then, fix any URLs with ports (like :5000 or :3000)
        fixedHtml = fixedHtml.replace(
          /(https?:\/\/[^\/\s"'<>]+)(:[0-9]+)(\S*)/g,
          `https://${productionDomain}$3`
        );
        
        // Log the changes
        const originalUrls = data.html.match(/(https?:\/\/[^\s"'<>]+)/g) || [];
        const fixedUrls = fixedHtml.match(/(https?:\/\/[^\s"'<>]+)/g) || [];
        
        console.log('URL fixes in production email:');
        for (let i = 0; i < Math.min(originalUrls.length, fixedUrls.length); i++) {
          if (originalUrls[i] !== fixedUrls[i]) {
            console.log(`- ${originalUrls[i]} → ${fixedUrls[i]}`);
          }
        }
        
        // Use the fixed HTML
        data.html = fixedHtml;
      }
    }
    
    // In development/test mode, log email content but don't actually send
    // Only skip sending if explicitly in development mode AND SEND_REAL_EMAILS is not set
    if (process.env.NODE_ENV === 'development' && !process.env.SEND_REAL_EMAILS) {
      console.log('Development mode - not sending real email. Would send:');
      console.log(`From: ${sender}`);
      console.log(`To: ${data.to}`);
      console.log(`Subject: ${data.subject}`);
      console.log('Text:', data.text);
      console.log('HTML:', data.html?.substring(0, 100) + '...');
      
      // Log URLs in the email for debugging
      if (data.html) {
        const matches = data.html.match(/(https?:\/\/[^\s"'<>]+)/g) || [];
        if (matches.length > 0) {
          console.log('URLs found in email:');
          matches.forEach(url => console.log(`- ${url}`));
        }
      }
      
      return { 
        success: true, 
        message: "Email sending simulated (development mode)" 
      };
    }
    
    // In production, log limited information for debugging
    if (process.env.NODE_ENV === 'production') {
      console.log(`Sending production email from: ${sender} to: ${data.to}`);
      console.log(`Subject: ${data.subject}`);
      
      // Extract and log URLs from the email in production for tracking
      if (data.html) {
        const matches = data.html.match(/(https?:\/\/[^\s"'<>]+)/g) || [];
        if (matches.length > 0) {
          console.log('URLs in production email:');
          matches.forEach(url => console.log(`- ${url}`));
        }
      }
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
    
    // Enhanced error logging for SendGrid errors
    if (error && typeof error === 'object') {
      console.error('SendGrid detailed error:', JSON.stringify(error, null, 2));
      
      // Check for response object which might contain more detailed SendGrid error info
      // Check if the error object has a response property
      const errorObj = error as any;
      if (errorObj && errorObj.response) {
        console.error('SendGrid response error:', errorObj.response);
        
        // Check if the response has a body property
        if (errorObj.response.body) {
          console.error('SendGrid response body:', errorObj.response.body);
        }
      }
    }
    
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