import React, { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import './App.css';

// Type definitions for API responses
interface ApiInfo {
  app_name: string;
  description: string;
  authentication: string;
  allowed_emails: number;
}

interface ProtectedData {
  message: string;
  data: string;
  user_email: string;
  game_access: boolean;
  auth_method: string;
}

interface UserInfo {
  email: string;
  name: string;
  picture?: string;
  authenticated: boolean;
  token_issuer?: string;
}

interface AuthResponse {
  authorization_url: string;
  state: string;
}

// Configuration
const API_BASE_URL = 'http://localhost:8000';

const App: React.FC = () => {
  const [apiInfo, setApiInfo] = useState<ApiInfo | null>(null);
  const [protectedData, setProtectedData] = useState<ProtectedData | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Check for auth token in URL params or localStorage on component mount
  useEffect(() => {
    checkAuthStatus();
    fetchApiInfo();
  }, []);

  const checkAuthStatus = (): void => {
    // Check URL params first (from OAuth redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    const sessionFromUrl = urlParams.get('session');

    if (tokenFromUrl) {
      // Store token and clean up URL
      setAuthToken(tokenFromUrl);
      localStorage.setItem('auth_token', tokenFromUrl);
      if (sessionFromUrl) {
        localStorage.setItem('session_id', sessionFromUrl);
      }
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Fetch user info with the new token
      fetchUserInfo(tokenFromUrl);
      return;
    }

    // Check localStorage for existing token
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setAuthToken(storedToken);
      fetchUserInfo(storedToken);
    }
  };

  const fetchApiInfo = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<ApiInfo>(`${API_BASE_URL}/api/info`);
      setApiInfo(response.data);
    } catch (err) {
      const errorMessage = err instanceof AxiosError 
        ? `Failed to fetch API info: ${err.message}`
        : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInfo = async (token?: string): Promise<void> => {
    const tokenToUse = token || authToken;
    if (!tokenToUse) return;

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<UserInfo>(`${API_BASE_URL}/auth/user`, {
        headers: {
          'Authorization': `Bearer ${tokenToUse}`
        }
      });
      setUserInfo(response.data);
    } catch (err) {
      const errorMessage = err instanceof AxiosError
        ? `Failed to fetch user info: ${err.message}`
        : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('User Info Error:', err);
      
      // If token is invalid, clear it
      if (err instanceof AxiosError && err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<AuthResponse>(`${API_BASE_URL}/auth/login`);
      
      // Redirect to Google OAuth
      window.location.href = response.data.authorization_url;
    } catch (err) {
      const errorMessage = err instanceof AxiosError
        ? `Failed to initiate login: ${err.message}`
        : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Login Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Call backend logout endpoint
      await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      });
    } catch (err) {
      console.error('Logout Error:', err);
    } finally {
      // Clear local state regardless of backend response
      setAuthToken(null);
      setUserInfo(null);
      setProtectedData(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('session_id');
      setLoading(false);
    }
  };

  const fetchProtectedData = async (): Promise<void> => {
    if (!authToken) {
      setError('Please log in first');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<ProtectedData>(`${API_BASE_URL}/api/protected`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      setProtectedData(response.data);
    } catch (err) {
      const errorMessage = err instanceof AxiosError
        ? `Failed to fetch protected data: ${err.message}`
        : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Protected API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎲 Boardgame App</h1>
        <p>Play boardgames with friends remotely!</p>
      </header>

      <main className="App-main">
        {/* API Connection Status */}
        <section className="api-status">
          <h2>API Connection</h2>
          {loading && <p>Loading...</p>}
          {error && <p className="error">❌ {error}</p>}
          {apiInfo && (
            <div className="success">
              <p>✅ Connected to API!</p>
              <p><strong>App:</strong> {apiInfo.app_name}</p>
              <p><strong>Description:</strong> {apiInfo.description}</p>
              <p><strong>Auth:</strong> {apiInfo.authentication}</p>
              <p><strong>Allowed users:</strong> {apiInfo.allowed_emails}</p>
            </div>
          )}
          <button onClick={fetchApiInfo} disabled={loading}>
            Test API Connection
          </button>
        </section>

        {/* Authentication Section */}
        <section className="auth-section">
          <h2>Authentication</h2>
          {userInfo ? (
            <div className="user-info">
              <p>✅ Logged in as:</p>
              <div className="user-details">
                {userInfo.picture && (
                  <img 
                    src={userInfo.picture} 
                    alt="Profile" 
                    className="profile-picture"
                  />
                )}
                <div>
                  <p><strong>Name:</strong> {userInfo.name}</p>
                  <p><strong>Email:</strong> {userInfo.email}</p>
                  <p><strong>Auth Method:</strong> {userInfo.token_issuer || 'Google'}</p>
                </div>
              </div>
              <button onClick={handleLogout} disabled={loading} className="logout-btn">
                Sign Out
              </button>
            </div>
          ) : (
            <div>
              <p>🔒 You are not logged in</p>
              <button onClick={handleLogin} disabled={loading} className="login-btn">
                Sign in with Google
              </button>
            </div>
          )}
        </section>

        {/* Protected Content */}
        <section className="protected-section">
          <h2>Game Access</h2>
          {userInfo ? (
            <div>
              <p>🎮 You have access to game features!</p>
              <button onClick={fetchProtectedData} disabled={loading}>
                Access Game Data
              </button>
              {protectedData && (
                <div className="protected-data">
                  <p><strong>Message:</strong> {protectedData.message}</p>
                  <p><strong>Data:</strong> {protectedData.data}</p>
                  <p><strong>Game Access:</strong> {protectedData.game_access ? '✅ Granted' : '❌ Denied'}</p>
                  <p><strong>Auth Method:</strong> {protectedData.auth_method}</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p>🔒 Please log in to access game features</p>
              <button onClick={fetchProtectedData} disabled={!authToken || loading}>
                Try Access Game Data
              </button>
            </div>
          )}
        </section>
      </main>

      <footer>
        <p>
          Frontend: React + TypeScript | Backend: FastAPI | 
          Auth: {userInfo ? '✅ Google OAuth2' : '🔒 Not Authenticated'}
        </p>
      </footer>
    </div>
  );
};

export default App;
