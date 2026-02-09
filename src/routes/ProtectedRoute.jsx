import { useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";

/**
 * ProtectedRoute Component
 * 
 * Handles THREE authentication states:
 * 1. AUTHENTICATED: Has valid JWT token → Allow dashboard access
 * 2. RESET-AUTHORIZED: Has valid reset token + email + role → Allow ONLY ChangePassword
 * 3. UNAUTHENTICATED: No token → Redirect to login
 * 
 * Security rules:
 * - Dashboard routes require JWT (state 1)
 * - ChangePassword allows reset-authorized users (state 2)
 * - All other routes require JWT
 */
export default function ProtectedRoute({ children, allowedRoles, isResetPage = false }) {
  const [searchParams] = useSearchParams();
  
  const role = localStorage.getItem("role");
  const vtufest_token = localStorage.getItem("vtufest_token");

  
  // Extract reset parameters from URL (only relevant for ChangePassword)
  const resetToken = searchParams.get("token");
  const resetEmail = searchParams.get("email");
  const resetRole = searchParams.get("role");

  // ============================================
  // STATE 2: RESET-AUTHORIZED (ChangePassword only)
  // ============================================
  if (isResetPage) {
    /**
     * SECURITY DECISION: Allow access to ChangePassword if:
     * 1. User has reset token + email + role in URL
     * 2. Backend will validate token against database
     * 3. This prevents unauthorized access while allowing forced reset
     * 
     * WHY SECURE:
     * - Token is validated by backend (not frontend)
     * - Token expires in 15 minutes
     * - Token is one-time use (cleared after reset)
     * - Forgot-password flow uses same validation
     */
    if (resetToken && resetEmail && resetRole) {
      // Allow access - backend validates token authenticity
      return children;
    }
    
    /**
     * SECURITY: If no reset parameters, redirect to login
     * This prevents direct access to /changepassword without token
     */
    return <Navigate to="/" replace />;
  }

  // ============================================
  // STATE 1 & 3: AUTHENTICATED or UNAUTHENTICATED
  // ============================================
  
  // STATE 3: Not logged in → Redirect to login
  if (!role || !vtufest_token) {
    return <Navigate to="/" replace />;
  }

  // STATE 1: Logged in but wrong role → Redirect to appropriate dashboard
  if (!allowedRoles.includes(role)) {
    if (role === "student") return <Navigate to="/dashboard" replace />;
    if (role === "principal") return <Navigate to="/principal-dashboard" replace />;
    if (role === "subadmin") return <Navigate to="/subadmin-dashboard" replace />;
    if (role === "manager") return <Navigate to="/manager-dashboard" replace />;
    
    // Fallback to login
    return <Navigate to="/" replace />;
  }

  // STATE 1: Authenticated with correct role → Allow access
  return children;
}