// This is an example of how to integrate Google OAuth in your React frontend
// Update the API calls and routes as needed for your project

import { useAuthStore } from '../store/useAuthStore';
import { JWTService } from '../services/jwtService'; // Frontend JWT service

// Example 1: Using Google Sign-In Button (Recommended)
export const GoogleSignInButton = () => {
  const handleSuccess = async (credentialResponse: any) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/google-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: credentialResponse.credential
        })
      });

      const data = await response.json();
      if (data.success) {
        // Save token and user to store/localStorage
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        // Update auth store
        const { user, token } = data.data;
        useAuthStore.setState({ user });
        
        // Redirect to dashboard
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };

  return (
    <div>
      {/* Add Google Sign-In Script */}
      <script src="https://accounts.google.com/gsi/client" async defer></script>
      <div
        id="g_id_onload"
        data-client_id="YOUR_GOOGLE_CLIENT_ID"
        data-callback="handleCredentialResponse"
      ></div>
      <div className="g_id_signin" data-type="standard"></div>
    </div>
  );
};

// Example 2: Using OAuth Flow
export const initGoogleOAuthFlow = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/google');
    const data = await response.json();
    
    if (data.success) {
      // Redirect user to Google login page
      window.location.href = data.data.authUrl;
    }
  } catch (error) {
    console.error('Failed to get Google auth URL:', error);
  }
};

// Example 3: Handle OAuth Callback
// This runs when user is redirected back from Google
export const handleGoogleCallback = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const userStr = params.get('user');

  if (token && userStr) {
    try {
      const user = JSON.parse(decodeURIComponent(userStr));
      
      // Save to localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update auth store
      useAuthStore.setState({ user });
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Failed to process callback:', error);
    }
  }
};

// Example 4: Login Component with both Email and Google
import React, { useState } from 'react';
import { loginWithEmail } from '../services/api';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuthStore();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/google');
      const data = await response.json();
      window.location.href = data.data.authUrl;
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleEmailLogin}>
        <h2>Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="divider">OR</div>

      <button onClick={handleGoogleLogin} className="google-login-btn">
        <img src="https://www.gstatic.com/images/branding/product/1x/googleg_standard_color_128dp.png" alt="Google" />
        Sign in with Google
      </button>

      <p>
        Don't have an account? <a href="/register">Register here</a>
      </p>
    </div>
  );
};

// Example 5: Update your API service
// Add this to your src/services/api.ts or create a new google service

export const googleLoginWithIdToken = async (idToken: string) => {
  try {
    const response = await fetch('/api/auth/google-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken })
    });

    if (!response.ok) {
      throw new Error('Google login failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Google login error:', error);
    throw error;
  }
};

// Example 6: Update useAuthStore to handle Google login
// Modify your useAuthStore.ts

/*
import { create } from 'zustand';
import { loginWithEmail, googleLoginWithIdToken } from '../services/api';
import type { User } from '../services/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  login: async (email, pass) => {
    set({ isLoading: true, error: null });
    try {
      const user = await loginWithEmail(email, pass);
      set({ user, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "Failed to login", isLoading: false });
    }
  },
  googleLogin: async (idToken) => {
    set({ isLoading: true, error: null });
    try {
      const response = await googleLoginWithIdToken(idToken);
      set({ user: response.data.user, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "Google login failed", isLoading: false });
    }
  },
  logout: () => set({ user: null })
}));
*/