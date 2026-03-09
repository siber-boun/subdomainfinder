import React, { useState } from 'react';
import { Card, Input, Button, Checkbox } from '../components/ui';

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, perform validation and API call here
    onLogin();
  };

  return (
    <div className="login-page fade-in">
      <div className="login-container">
        <div className="login-logo">
          <div className="logo-icon">🛡️</div>
          <h1>CyberMaturity</h1>
        </div>
        
        <Card className="login-card">
          <div className="login-header">
            <h2>Sign In</h2>
            <p>Assess your organization's cybersecurity maturity</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <Input 
              label="Email or Username"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <Input 
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            <div className="login-actions">
              <Checkbox label="Remember me" />
              <a href="#" className="forgot-password">Forgot password?</a>
            </div>
            
            <Button type="submit" variant="secondary" fullWidth className="submit-btn">
              Sign In
            </Button>
          </form>
          
          <div className="login-footer">
            <p>Don't have an account? <a href="#">Contact Sales</a></p>
          </div>
        </Card>
      </div>
      
      <style>{`
        .login-page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 1.5rem;
          background: radial-gradient(circle at top right, #1e293b, #0f172a);
        }
        
        .login-container {
          width: 100%;
          max-width: 440px;
        }
        
        .login-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
          color: white;
        }
        
        .logo-icon {
          font-size: 2rem;
        }
        
        .login-logo h1 {
          font-size: 1.75rem;
          font-weight: 800;
          letter-spacing: -0.025em;
        }
        
        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .login-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary);
          margin-bottom: 0.5rem;
        }
        
        .login-header p {
          color: var(--text-muted);
          font-size: 0.875rem;
        }
        
        .login-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
        }
        
        .forgot-password {
          font-size: 0.875rem;
          color: var(--accent);
          text-decoration: none;
          font-weight: 500;
        }
        
        .forgot-password:hover {
          text-decoration: underline;
        }
        
        .submit-btn {
          margin-bottom: 1.5rem;
        }
        
        .login-footer {
          text-align: center;
          font-size: 0.875rem;
          color: var(--text-muted);
        }
        
        .login-footer a {
          color: var(--accent);
          text-decoration: none;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};
