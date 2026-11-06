import { supabase } from '../../../shared/lib/supabase';

export interface SendOtpParams {
  email: string;
  fullName: string;
  designation: string;
  purpose?: 'registration' | 'login' | 'reset_password';
  payload?: Record<string, unknown>;
}

export interface SendOtpResult {
  success: boolean;
  message: string;
  error?: string;
  devOtp?: string;
}

export interface VerifyOtpResult {
  success: boolean;
  message?: string;
  error?: string;
  payload?: Record<string, unknown>;
}


export class ResendOtpService {
  /**
   * Dispatches an OTP to the officer's email using Resend via Supabase Edge Function
   * Requires RESEND_API_KEY to be configured in Supabase secrets
   */
  static async sendOtp({
    email,
    fullName,
    designation,
    purpose = 'registration',
    payload = {},
  }: SendOtpParams): Promise<SendOtpResult> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return { success: false, message: '', error: 'Please enter a valid official email address.' };
    }

    // Use Supabase Edge Function which handles Resend API securely server-side
    try {
      const { data, error } = await supabase.functions.invoke('send-email-otp', {
        body: {
          email: normalizedEmail,
          fullName,
          designation,
          purpose,
          payload,
        },
      });

      if (error) {
        let serverErrorMsg = error.message;
        try {
          if ('context' in error && (error as any).context) {
            const errJson = await (error as any).context.json();
            if (errJson?.error) serverErrorMsg = errJson.error;
          }
        } catch {
          // ignore
        }
        console.error('send-email-otp error:', serverErrorMsg);
        return {
          success: false,
          message: '',
          error: serverErrorMsg || 'Failed to send verification email. Please try again or contact support.',
        };
      }

      if (data?.success) {
        return {
          success: true,
          message: data.message || 'OTP sent successfully via Resend.',
          devOtp: data.devOtp,
        };
      }

      return {
        success: false,
        message: '',
        error: data?.error || 'Failed to send verification email.',
      };
    } catch (invokeErr) {
      console.error('send-email-otp invocation failed:', invokeErr);
      return {
        success: false,
        message: '',
        error: 'Network error while sending verification email. Please check your connection and try again.',
      };
    }
  }

  /**
   * Verifies the 6-digit OTP
   */
  static async verifyOtp(
    email: string,
    otpCode: string,
    purpose: 'registration' | 'login' | 'reset_password' = 'registration'
  ): Promise<VerifyOtpResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const token = otpCode.trim();

    if (!normalizedEmail || !token) {
      return { success: false, error: 'Email and 6-digit OTP code are required.' };
    }

    try {
      const { data, error } = await supabase.rpc('verify_officer_email_otp', {
        p_email: normalizedEmail,
        p_otp_code: token,
        p_purpose: purpose,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data && typeof data === 'object') {
        const result = data as { success: boolean; error?: string; message?: string; payload?: Record<string, unknown> };
        if (!result.success) {
          return { success: false, error: result.error || 'Invalid or expired OTP code.' };
        }
        return {
          success: true,
          message: result.message || 'Email verified successfully.',
          payload: result.payload,
        };
      }

      return { success: true, message: 'OTP verified successfully.' };
    } catch (err) {
      return { success: false, error: (err as Error).message || 'Verification service error.' };
    }
  }

  /**
   * Resets password using the verified OTP code via Edge Function
   */
  static async resetPassword({
    email,
    token,
    newPassword,
  }: {
    email: string;
    token: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string; error?: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanToken = token.trim();
    const cleanPassword = newPassword.trim();

    if (!normalizedEmail || !cleanToken || !cleanPassword) {
      return { success: false, message: '', error: 'Email, verification code, and new password are required.' };
    }

    if (cleanPassword.length < 6) {
      return { success: false, message: '', error: 'Password must be at least 6 characters long.' };
    }

    try {
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: {
          email: normalizedEmail,
          token: cleanToken,
          newPassword: cleanPassword,
        },
      });

      if (!error && data?.success) {
        return {
          success: true,
          message: data.message || 'Password has been reset successfully.',
        };
      }

      if (error) {
        let serverErrorMsg = error.message;
        try {
          if ('context' in error && (error as any).context) {
            const errJson = await (error as any).context.json();
            if (errJson?.error) serverErrorMsg = errJson.error;
          }
        } catch {
          // ignore
        }
        return {
          success: false,
          message: '',
          error: serverErrorMsg || 'Failed to reset password.',
        };
      }

      return {
        success: false,
        message: '',
        error: data?.error || 'Password reset failed.',
      };
    } catch (err) {
      return {
        success: false,
        message: '',
        error: (err as Error).message || 'Server error during password reset.',
      };
    }
  }
}
