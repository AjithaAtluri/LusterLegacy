import { MailService } from '@sendgrid/mail';

// Check for required environment variables for email functionality
if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable is not set. Email functionality will be disabled.");
} else {
  console.log("SENDGRID_API_KEY is set and available for use");
}

if (!process.env.VERIFIED_SENDER_EMAIL) {
  console.warn("VERIFIED_SENDER_EMAIL environment variable is not set. Using default sender email.");
} else {
  console.log(`VERIFIED_SENDER_EMAIL is set to: ${process.env.VERIFIED_SENDER_EMAIL}`);
}

// Initialize SendGrid mail service
const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  try {
    mailService.setApiKey(process.env.SENDGRID_API_KEY);
    console.log("SendGrid API configured successfully with provided API key");
    
    // Verify the API key is correctly formatted (won't verify if it's valid though)
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey.startsWith('SG.')) {
      console.warn("WARNING: SendGrid API key doesn't follow expected format. Should start with 'SG.'");
    }
    if (apiKey.length < 50) {
      console.warn("WARNING: SendGrid API key appears to be too short. Standard keys are longer.");
    }
  } catch (error) {
    console.error("ERROR initializing SendGrid client:", error);
  }
}

// Default configuration values
const DEFAULT_SENDER_NAME = 'Luster Legacy';
const DEFAULT_SENDER_EMAIL = 'noreply@lusterlegacy.co'; // Updated to match domain

// Use verified sender email from environment variable if available
const VERIFIED_SENDER_EMAIL = process.env.VERIFIED_SENDER_EMAIL || DEFAULT_SENDER_EMAIL;

console.log(`Email service initialized with sender: ${DEFAULT_SENDER_NAME} <${VERIFIED_SENDER_EMAIL}>`);

// Flag to indicate if we should use a backup email method when SendGrid fails
const USE_BACKUP_EMAIL_METHOD = true;

// Flag to allow diagnostic email tests in development
const ALLOW_TEST_EMAILS = process.env.NODE_ENV !== 'production';

interface EmailData {
  to: string;
  subject: string;
  text?: string;
  html: string;
  from?: string;
  isPasswordReset?: boolean; // Flag to mark password reset emails for special handling
  isDiagnostic?: boolean; // Flag to mark diagnostic test emails
}

/**
 * Send an email using SendGrid
 */
export async function sendEmail(data: EmailData): Promise<{ success: boolean; message?: string }> {
  try {
    // Check if this is a critical email (password reset or verification)
    const isCriticalEmail = 
      data.subject?.includes("Password Reset") || 
      data.subject?.includes("Verify Your Email") ||
      data.subject?.includes("Email Verification") ||
      data.isPasswordReset === true;  // Use the explicit flag too
    
    // Always log that we're attempting to send an email
    const sender = data.from || `${DEFAULT_SENDER_NAME} <${VERIFIED_SENDER_EMAIL}>`;
    console.log(`[EMAIL] Attempting to send email from: ${sender} to: ${data.to}`);
    console.log(`[EMAIL] Email subject: "${data.subject}"`);
    console.log(`[EMAIL] Is critical account email: ${isCriticalEmail ? 'YES' : 'no'}`);
    
    // Special handling for password reset emails
    if (data.isPasswordReset) {
      console.log(`[EMAIL] PASSWORD RESET EMAIL: Special handling enabled`);
    }
    
    // If SendGrid API key is missing, we can't send actual emails
    if (!process.env.SENDGRID_API_KEY) {
      console.error("[EMAIL] SENDGRID_API_KEY is missing - cannot send emails!");
      
      if (isCriticalEmail) {
        console.error("[EMAIL] CRITICAL EMAIL FAILED: Cannot send important account email without SendGrid API key");
        console.error("[EMAIL] CRITICAL EMAIL CONTENT:");
        console.error(`[EMAIL] To: ${data.to}`);
        console.error(`[EMAIL] Subject: ${data.subject}`);
        console.error(`[EMAIL] Text: ${data.text}`);
        console.error("[EMAIL] HTML preview:", data.html?.substring(0, 200) + "...");
      } else {
        console.log("[EMAIL] Email data that would be sent:", { 
          to: data.to, 
          from: sender, 
          subject: data.subject,
          textPreview: data.text?.substring(0, 50) + "..."
        });
      }
      
      // For password resets, we'll include the failure in the result message
      if (data.isPasswordReset) {
        return { 
          success: false, 
          message: "Failed to send password reset email: SendGrid API key is missing" 
        };
      }
      
      return { 
        success: false, 
        message: "Failed to send email: SendGrid API key is missing" 
      };
    }
    
    // Validate and fix email URLs in links
    if (process.env.NODE_ENV === 'production' && data.html) {
      // Check for development URLs in production emails
      const devUrlPattern = /(https?:\/\/localhost:[0-9]+|https?:\/\/[^\/\s"'<>]+:[0-9]+)/g;
      const hasDevUrls = devUrlPattern.test(data.html);
      
      if (hasDevUrls) {
        console.warn('[EMAIL] WARNING: Production email contains localhost or port references - attempting to fix:');
        
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
        
        console.log('[EMAIL] URL fixes in production email:');
        for (let i = 0; i < Math.min(originalUrls.length, fixedUrls.length); i++) {
          if (originalUrls[i] !== fixedUrls[i]) {
            console.log(`[EMAIL] - ${originalUrls[i]} → ${fixedUrls[i]}`);
          }
        }
        
        // Use the fixed HTML
        data.html = fixedHtml;
      }
    }
    
    // Determine if we should actually send the email
    let shouldSendEmail = true;
    
    // OVERRIDE: Always send critical emails (like password reset) regardless of environment
    // This change ensures password reset emails work even in development mode
    if (isCriticalEmail) {
      console.log('[EMAIL] CRITICAL EMAIL: Always sending this important account-related email');
      shouldSendEmail = true;
    }
    // In development, only send if either:
    // 1. SEND_REAL_EMAILS is set, or
    // 2. It's a critical email and ALWAYS_SEND_CRITICAL_EMAILS is set,
    // OR when forced to send via the API
    else if (process.env.NODE_ENV === 'development') {
      const sendRealEmails = !!process.env.SEND_REAL_EMAILS;
      const alwaysSendCritical = !!process.env.ALWAYS_SEND_CRITICAL_EMAILS;
      
      shouldSendEmail = sendRealEmails || (isCriticalEmail && alwaysSendCritical);
      
      // If we're not sending, log the content
      if (!shouldSendEmail) {
        console.log('[EMAIL] Development mode - not sending real email. Would send:');
        console.log(`[EMAIL] From: ${sender}`);
        console.log(`[EMAIL] To: ${data.to}`);
        console.log(`[EMAIL] Subject: ${data.subject}`);
        console.log('[EMAIL] Text:', data.text);
        console.log('[EMAIL] HTML preview:', data.html?.substring(0, 100) + '...');
        
        // Log URLs in the email for debugging
        if (data.html) {
          const matches = data.html.match(/(https?:\/\/[^\s"'<>]+)/g) || [];
          if (matches.length > 0) {
            console.log('[EMAIL] URLs found in email:');
            matches.forEach(url => console.log(`[EMAIL] - ${url}`));
          }
        }
        
        return { 
          success: true, 
          message: "Email sending simulated (development mode)" 
        };
      }
    }
    
    // If we got here, we are sending a real email
    console.log(`[EMAIL] Sending real email to ${data.to} via SendGrid API`);
    
    // Prepare and send the email
    try {
      console.log(`[EMAIL] Attempting to send email via SendGrid API to: ${data.to}`);
      console.log(`[EMAIL] From: ${sender}`);
      console.log(`[EMAIL] Subject: ${data.subject}`);
      
      const result = await mailService.send({
        to: data.to,
        from: sender,
        subject: data.subject,
        text: data.text,
        html: data.html,
      });
      
      console.log(`[EMAIL] SendGrid API response:`, JSON.stringify(result));
      console.log(`[EMAIL] Email sent successfully to ${data.to}`);
      return { success: true };
    } catch (sendError: any) {
      console.error(`[EMAIL] SendGrid API sending error:`, sendError);
      
      // Enhanced error logging for SendGrid errors
      console.error('[EMAIL] SendGrid detailed error:', JSON.stringify(sendError, null, 2));
      
      // Check for response object which might contain more detailed SendGrid error info
      if (sendError && sendError.response) {
        console.error('[EMAIL] SendGrid response error:', sendError.response);
        
        // Check if the response has a body property
        if (sendError.response.body) {
          console.error('[EMAIL] SendGrid response body:', sendError.response.body);
        }
      }
      
      // For critical emails like password resets, we want to provide special handling
      if (data.isPasswordReset && USE_BACKUP_EMAIL_METHOD) {
        console.log(`[EMAIL] CRITICAL EMAIL FALLBACK: Attempting alternate methods to ensure delivery`);
        
        // The actual backup method would be implemented here, but for now we'll just log
        console.log(`[EMAIL] CRITICAL EMAIL FALLBACK: Password reset for ${data.to}`);
        console.log(`[EMAIL] CRITICAL EMAIL FALLBACK: Subject: ${data.subject}`);
        
        // Extract links that might be in the password reset email
        if (data.html) {
          const links = data.html.match(/(https?:\/\/[^\s"'<>]+)/g) || [];
          if (links.length > 0) {
            console.log('[EMAIL] CRITICAL EMAIL FALLBACK: Important links found:');
            links.forEach(link => console.log(`[EMAIL] CRITICAL LINK: ${link}`));
          }
        }
        
        // Log that we failed but provided fallback info
        return {
          success: false,
          message: "Email sending failed, but critical information was preserved in logs"
        };
      }
      
      return { 
        success: false, 
        message: sendError instanceof Error ? sendError.message : 'Unknown email error'
      };
    }
  } catch (error: any) {
    console.error('[EMAIL] Unexpected error in email service:', error);
    
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
  
  // Log password reset attempt
  console.log(`[PASSWORD RESET] Attempting to send password reset email to ${email}`);
  console.log(`[PASSWORD RESET] Reset link: ${resetLink}`);
  
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
  
  const plainText = `Hello ${displayName}, we received a request to reset your password. Please visit this link to reset your password: ${resetLink}. This link will expire in 1 hour.`;
  
  // Save the password reset info in a more accessible place for debugging
  console.log(`[PASSWORD RESET] Direct access to reset: ${resetLink}`);
  
  // Try to send the email with special flag for password resets
  const result = await sendEmail({
    to: email,
    subject: 'Password Reset - Luster Legacy',
    html: emailHtml,
    text: plainText,
    isPasswordReset: true
  });
  
  // Always log whether the password reset email succeeded or failed
  if (result.success) {
    console.log(`[PASSWORD RESET] Email sent successfully to ${email}`);
  } else {
    console.error(`[PASSWORD RESET] Failed to send email to ${email}: ${result.message}`);
    
    // For password resets specifically, provide detailed debug info
    console.log(`[PASSWORD RESET EMERGENCY FALLBACK] Reset Link: ${resetLink}`);
    console.log(`[PASSWORD RESET EMERGENCY FALLBACK] User: ${email} (${displayName})`);
  }
  
  return result;
}

/**
 * Send a test email - only available in development mode
 */
export async function sendTestEmail(
  to: string
): Promise<{ success: boolean; message: string; details?: any }> {
  if (!ALLOW_TEST_EMAILS) {
    return {
      success: false,
      message: "Test emails are only available in development mode"
    };
  }
  
  console.log(`[EMAIL SERVICE] Sending diagnostic test email to ${to}`);
  
  const subject = "Luster Legacy Email System Test";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #F5F5F5; padding: 20px; text-align: center; border-bottom: 3px solid #D4AF37;">
        <h1 style="color: #333; margin: 0;">Luster Legacy</h1>
      </div>
      <div style="padding: 20px; background-color: #ffffff; border: 1px solid #e0e0e0;">
        <h2 style="color: #333;">Email System Test</h2>
        <p>This is a test email from the Luster Legacy email system.</p>
        <p>If you received this email, it means the email delivery system is working correctly.</p>
        <p><strong>Time sent:</strong> ${new Date().toISOString()}</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
        <div style="margin-top: 30px;">
          <p>Thank you,</p>
          <p><strong>Luster Legacy Team</strong></p>
        </div>
      </div>
      <div style="padding: 15px; background-color: #333333; color: #ffffff; text-align: center; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Luster Legacy. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    // Collect diagnostic information
    const diagnosticInfo = {
      sendgridApiKeyExists: !!process.env.SENDGRID_API_KEY,
      sendgridApiKeyLength: process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.length : 0,
      verifiedSenderEmail: VERIFIED_SENDER_EMAIL,
      defaultSenderEmail: DEFAULT_SENDER_EMAIL,
      environment: process.env.NODE_ENV || 'development',
      useBackupMethod: USE_BACKUP_EMAIL_METHOD,
      timestamp: new Date().toISOString()
    };
    
    console.log(`[EMAIL SERVICE] Diagnostic information: ${JSON.stringify(diagnosticInfo)}`);
    
    const result = await sendEmail({
      to,
      subject,
      html,
      isDiagnostic: true
    });
    
    if (result.success) {
      console.log(`[EMAIL SERVICE] Test email sent successfully to ${to}`);
    } else {
      console.error(`[EMAIL SERVICE] Failed to send test email: ${result.message}`);
    }
    
    return {
      success: result.success,
      message: result.message || "Email test completed",
      details: diagnosticInfo
    };
  } catch (error) {
    console.error(`[EMAIL SERVICE] Exception when sending test email:`, error);
    
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Unknown error sending test email",
      details: {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : null,
        sendgridApiKeyExists: !!process.env.SENDGRID_API_KEY,
        verifiedSenderExists: !!process.env.VERIFIED_SENDER_EMAIL,
        timestamp: new Date().toISOString()
      }
    };
  }
}

export async function sendPasswordChangeEmail(
  email: string, 
  name: string | null
): Promise<{ success: boolean; message?: string }> {
  const displayName = name || 'Valued Customer';
  
  console.log(`[PASSWORD CHANGE] Preparing confirmation email for ${email} (${displayName})`);
  
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
  
  try {
    const result = await sendEmail({
      to: email,
      subject: 'Password Changed - Luster Legacy',
      html: emailHtml,
      text: `Hello ${displayName}, your password has been successfully changed. If you did not initiate this change, please contact us immediately.`
    });
    
    if (result.success) {
      console.log(`[PASSWORD CHANGE] Confirmation email sent successfully to ${email}`);
    } else {
      console.error(`[PASSWORD CHANGE] Failed to send confirmation email to ${email}: ${result.message}`);
    }
    
    return result;
  } catch (error) {
    console.error(`[PASSWORD CHANGE] Exception sending confirmation email:`, error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Unknown error sending password change confirmation" 
    };
  }
}

/**
 * Send a notification email when a comment is added to a custom design request
 */
export async function sendDesignCommentNotification(
  email: string,
  name: string | null,
  designRequestId: number,
  designName: string,
  commentContent: string,
  commentBy: string,
  isFromAdmin: boolean,
  dashboardLink: string
): Promise<{ success: boolean; message?: string }> {
  console.log('=== DESIGN COMMENT NOTIFICATION TRIGGERED ===');
  console.log(`[DESIGN COMMENT] Email:        ${email}`);
  console.log(`[DESIGN COMMENT] Name:         ${name || 'null'}`);
  console.log(`[DESIGN COMMENT] Design ID:    ${designRequestId}`);
  console.log(`[DESIGN COMMENT] Design Name:  ${designName}`);
  console.log(`[DESIGN COMMENT] Comment By:   ${commentBy}`);
  console.log(`[DESIGN COMMENT] Is Admin:     ${isFromAdmin}`);
  console.log(`[DESIGN COMMENT] Dashboard:    ${dashboardLink}`);
  console.log(`[DESIGN COMMENT] Content:      ${commentContent.substring(0, 100)}${commentContent.length > 100 ? '...' : ''}`);
  
  // Check email configuration
  console.log(`[DESIGN COMMENT] SendGrid API Key:     ${process.env.SENDGRID_API_KEY ? 'Present' : 'MISSING'}`);
  console.log(`[DESIGN COMMENT] Verified Sender:      ${process.env.VERIFIED_SENDER_EMAIL || 'Using default sender'}`);
  
  const displayName = name || 'Valued Customer';
  const commentSource = isFromAdmin ? 'a Luster Legacy artisan' : commentBy;
  
  console.log(`[DESIGN COMMENT] Sending notification email to ${email} for design #${designRequestId}`);
  
  // Truncate long comments for the email
  const truncatedComment = commentContent.length > 300 
    ? commentContent.substring(0, 300) + '...' 
    : commentContent;
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #F5F5F5; padding: 20px; text-align: center; border-bottom: 3px solid #D4AF37;">
        <h1 style="color: #333; margin: 0;">Luster Legacy</h1>
      </div>
      <div style="padding: 20px; background-color: #ffffff; border: 1px solid #e0e0e0;">
        <h2 style="color: #333;">New Comment on Your Design Request</h2>
        <p>Hello ${displayName},</p>
        <p>You have received a new comment on your custom design request "${designName}" from ${commentSource}.</p>
        
        <div style="background-color: #f9f9f9; border-left: 4px solid #D4AF37; padding: 15px; margin: 20px 0;">
          <p style="font-style: italic;">"${truncatedComment}"</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardLink}" style="background-color: #D4AF37; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Details & Respond</a>
        </div>
        
        <p>For your convenience, you can view all comments and respond directly through your customer dashboard.</p>
      </div>
      <div style="padding: 15px; background-color: #333333; color: #ffffff; text-align: center; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Luster Legacy. All rights reserved.</p>
      </div>
    </div>
  `;
  
  const plainText = `Hello ${displayName}, you have received a new comment on your custom design request "${designName}" from ${commentSource}:\n\n"${truncatedComment}"\n\nTo view details and respond, please visit: ${dashboardLink}`;
  
  try {
    const result = await sendEmail({
      to: email,
      subject: `New Comment on Your Custom Design - Luster Legacy`,
      html: emailHtml,
      text: plainText
    });
    
    if (result.success) {
      console.log(`[DESIGN COMMENT] Notification email sent successfully to ${email}`);
    } else {
      console.error(`[DESIGN COMMENT] Failed to send notification email to ${email}: ${result.message}`);
    }
    
    return result;
  } catch (error) {
    console.error(`[DESIGN COMMENT] Exception sending notification email:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}