import React, { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import './App.css';

// Type definitions for API responses
interface ApiInfo {
  app_name: string;
  description: string;
  authentication: string;
}

interface ProtectedData {
  message: string;
  data: string;
}

// Configuration
const API_BASE_URL = 'http://localhost:8000';

const App: React.FC = () => {
  const [apiInfo, setApiInfo] = useState<ApiInfo | null>(null);
  const [protectedData, setProtectedData] = useState<ProtectedData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch public API info when component mounts
  useEffect(() => {
    fetchApiInfo();
  }, []);

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

  const fetchProtectedData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<ProtectedData>(`${API_BASE_URL}/api/protected`);
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
            </div>
          )}
          <button onClick={fetchApiInfo} disabled={loading}>
            Test API Connection
          </button>
        </section>

        {/* Authentication Section */}
        <section className="auth-section">
          <h2>Authentication</h2>
          <p>🔒 You are not logged in</p>
          <button className="login-btn" disabled>
            Sign in with Google (Coming Soon!)
          </button>
        </section>

        {/* Protected Content */}
        <section className="protected-section">
          <h2>Game Access</h2>
          <p>Try accessing protected content:</p>
          <button onClick={fetchProtectedData} disabled={loading}>
            Access Game Data
          </button>
          {protectedData && (
            <div className="protected-data">
              <p><strong>Message:</strong> {protectedData.message}</p>
              <p><strong>Data:</strong> {protectedData.data}</p>
            </div>
          )}
        </section>
      </main>

      <footer>
        <p>Frontend: React + TypeScript | Backend: FastAPI | Auth: Google OAuth (Soon!)</p>
      </footer>
    </div>
  );
};

export default App;
