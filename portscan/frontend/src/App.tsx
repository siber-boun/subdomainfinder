import { useState, useEffect } from 'react';

type AuthMode = 'login' | 'register';

interface UserData {
  email: string;
  password: string;
  targets: string[];
}

function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [targetInput, setTargetInput] = useState('');
  const [targets, setTargets] = useState<string[]>([]);
  const [selectedTarget, setSelectedDomain] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auth Logic
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const usersRaw = localStorage.getItem('busiber_users');
    const users: Record<string, UserData> = usersRaw ? JSON.parse(usersRaw) : {};

    if (authMode === 'register') {
      if (users[email]) {
        alert('User already exists');
        return;
      }
      users[email] = { email, password, targets: [] };
      localStorage.setItem('busiber_users', JSON.stringify(users));
      alert('Registration successful! Please login.');
      setAuthMode('login');
    } else {
      if (users[email] && users[email].password === password) {
        setIsLoggedIn(true);
        setCurrentUser(email);
        setTargets(users[email].targets || []);
      } else {
        alert('Invalid credentials');
      }
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setEmail('');
    setPassword('');
    setTargets([]);
    setSelectedDomain(null);
    setScanResult(null);
  };

  // Target Logic
  const addTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInput || targets.includes(targetInput)) return;

    const newTargets = [...targets, targetInput];
    setTargets(newTargets);
    setTargetInput('');

    // Save to localStorage
    if (currentUser) {
      const users = JSON.parse(localStorage.getItem('busiber_users') || '{}');
      users[currentUser].targets = newTargets;
      localStorage.setItem('busiber_users', JSON.stringify(users));
    }
  };

  const deleteTarget = (targetToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTargets = targets.filter(t => t !== targetToDelete);
    setTargets(newTargets);
    if (selectedTarget === targetToDelete) {
      setSelectedDomain(null);
      setScanResult(null);
    }

    if (currentUser) {
      const users = JSON.parse(localStorage.getItem('busiber_users') || '{}');
      users[currentUser].targets = newTargets;
      localStorage.setItem('busiber_users', JSON.stringify(users));
    }
  };

  const startScan = async (target: string) => {
    setSelectedDomain(target);
    setLoading(true);
    setScanResult(null);

    try {
      const response = await fetch(`http://localhost:3001/api/scan?target=${target}`);
      const data = await response.json();
      setScanResult(data);
    } catch (error) {
      alert('Error connecting to backend scanner.');
    } finally {
      setLoading(false);
    }
  };

  const scanSpecificIP = async (ip: string) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/portscan?ip=${ip}`);
      const data = await response.json();
      setScanResult({ type: 'portscan', target: ip, result: data.result });
    } catch (error) {
      alert('Error during port scan.');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>{authMode === 'login' ? 'BUSIBER Login' : 'Create Account'}</h1>
          <form onSubmit={handleAuth}>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                className="form-input" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input 
                className="form-input" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            <button className="btn" type="submit">
              {authMode === 'login' ? 'Sign In' : 'Register'}
            </button>
          </form>
          <button className="btn-link" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
            {authMode === 'login' ? "Don't have an account? Register" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>BUSIBER OSINT</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Logged in as {currentUser}</p>
        </div>
        <div className="sidebar-content">
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase' }}>
            Targets
          </p>
          {targets.map((t, idx) => (
            <div 
              key={idx} 
              className={`target-item ${selectedTarget === t ? 'active' : ''}`}
              onClick={() => startScan(t)}
            >
              <span>{t}</span>
              <button className="delete-btn" onClick={(e) => deleteTarget(t, e)}>×</button>
            </div>
          ))}
        </div>
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <button className="btn-link" style={{ color: 'var(--error-color)', margin: 0 }} onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="main-header">
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--accent-color)' }}>BUSIBER VULNERABILITY ASSESSMENT</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Identify subdomains and open ports for your targets.</p>
        </header>

        <div className="main-body">
          <div className="scan-box">
            <h3 style={{ marginBottom: '1rem' }}>Enter a Domain Name or IP Address</h3>
            <form onSubmit={addTarget} style={{ display: 'flex', gap: '1rem' }}>
              <input 
                className="form-input" 
                style={{ flex: 1 }}
                placeholder="e.g. example.com or 8.8.8.8"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
              />
              <button className="btn" style={{ width: 'auto', paddingLeft: '2rem', paddingRight: '2rem' }}>Add Target</button>
            </form>
          </div>

          {selectedTarget && (
            <div className="fade-in">
              <h2 style={{ marginBottom: '1.5rem' }}>Results for: {selectedTarget}</h2>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <p>Scanning in progress... Please wait.</p>
                </div>
              ) : (
                <div className="results-container">
                  {scanResult && (scanResult as any).type === 'subdomains' ? (
                    <div className="subdomain-grid">
                      <div className="subdomain-header">
                        <span>Subdomain</span>
                        <span>IP Address</span>
                      </div>
                      {(scanResult as any).result.map((item: any, idx: number) => (
                        <div key={idx} className="subdomain-row">
                          <span className="sub-name">{item.subdomain}</span>
                          <span 
                            className={`sub-ip ${item.ip ? 'clickable-ip' : ''}`}
                            onClick={() => item.ip && scanSpecificIP(item.ip)}
                          >
                            {item.ip || 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (scanResult && (scanResult as any).type === 'portscan') ? (
                    <div className="result-area">
                      {`PORT SCAN RESULT FOR ${(scanResult as any).target}:\n\n${(scanResult as any).result}`}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
