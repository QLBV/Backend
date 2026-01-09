import { Request, Response } from "express";
import jwt from "jsonwebtoken";

/**
 * OAuth Callback Success Handler
 * Called after successful OAuth authentication
 * Generates JWT token and returns to client
 */
export const oauthCallback = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;

    if (!user || !user.id) {
      return res.status(401).json({
        success: false,
        message: "OAuth authentication failed",
      });
    }

    // Generate JWT token
    const payload = {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
    };

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" } as jwt.SignOptions
    );

    // Redirect to frontend with token in URL
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const redirectUrl = `${frontendUrl}/auth/oauth/callback?token=${encodeURIComponent(token)}`;
    
    return res.redirect(redirectUrl);
  } catch (error: any) {
    // Log error for debugging
    console.error("OAuth callback error:", error);

    // Determine error type
    let errorType = "server_error";
    let errorMessage = "Đã xảy ra lỗi trong quá trình đăng nhập";

    if (error?.message) {
      if (error.message.includes("Email not provided")) {
        errorType = "email_not_provided";
        errorMessage = "Google không cung cấp địa chỉ email của bạn";
      } else if (error.message.includes("already exists")) {
        errorType = "account_exists";
        errorMessage = "Tài khoản đã tồn tại với phương thức đăng nhập khác";
      }
    }

    // Redirect to frontend error page
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const errorParams = new URLSearchParams({
      error: errorType,
      error_description: errorMessage,
    });

    return res.redirect(`${frontendUrl}/auth/oauth/error?${errorParams.toString()}`);
  }
};

/**
 * OAuth Failure Handler
 * Called when OAuth authentication fails
 * Redirects to frontend error page with error details
 */
export const oauthFailure = (req: Request, res: Response) => {
  const error = req.query.error as string;
  const errorDescription = req.query.error_description as string;
  const errorReason = req.query.error_reason as string;

  // Build error details
  const errorParams = new URLSearchParams();
  if (error) errorParams.append("error", error);
  if (errorDescription) errorParams.append("error_description", errorDescription);
  if (errorReason) errorParams.append("error_reason", errorReason);

  // Map common OAuth errors to user-friendly messages
  const errorMessages: Record<string, string> = {
    access_denied: "Bạn đã hủy quá trình đăng nhập",
    invalid_request: "Yêu cầu đăng nhập không hợp lệ",
    unauthorized_client: "Ứng dụng chưa được cấp phép",
    unsupported_response_type: "Lỗi cấu hình đăng nhập",
    server_error: "Lỗi máy chủ Google",
    temporarily_unavailable: "Dịch vụ Google tạm thời không khả dụng",
  };

  const userMessage = errorMessages[error] || "Đăng nhập thất bại";

  // Redirect to frontend error page
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const redirectUrl = `${frontendUrl}/auth/oauth/error?${errorParams.toString()}`;

  return res.redirect(redirectUrl);
};