import { useState, useEffect } from 'react';
import './index.css';

type Step = 'login' | 'register' | 'dashboard';

interface SubdomainData {
  name_value: string;
}

interface PortInfo {
  port: number;
  status: number | string;
  protocol: string;
}

interface SubdomainDetail {
  ip: string | null;
  ports?: PortInfo[];
  isCloudflare?: boolean;
  analyzing?: boolean;
}

// User data structure for localStorage
interface UserData {
  password: string;
  domains: string[];
  subdomainsCache: Record<string, string[]>;
  subdomainDetailsCache: Record<string, SubdomainDetail>;
}

// API Base URL - Local'de /api (Vite proxy üzerinden), Canlıda Render URL'si
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

function App() {
  const [step, setStep] = useState<Step>('login');
  
  // Auth states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  
  // Dashboard states
  const [domainInput, setDomainInput] = useState('');
  const [domains, setDomains] = useState<string[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [subdomains, setSubdomains] = useState<Record<string, string[]>>({});
  const [subdomainDetails, setSubdomainDetails] = useState<Record<string, SubdomainDetail>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [wakingUp, setWakingUp] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string>>({});
  
  const isLoginValid = email.includes('@') && password.length >= 6;
  const isRegisterValid = isLoginValid && password === confirmPassword;
  const isDomainValid = domainInput.length > 2 && !domainInput.includes(' ');

  // Load user data on login
  useEffect(() => {
    if (loggedInUser) {
      const usersRaw = localStorage.getItem('osint_users');
      if (usersRaw) {
        const users: Record<string, UserData> = JSON.parse(usersRaw);
        if (users[loggedInUser]) {
          setDomains(users[loggedInUser].domains || []);
          setSubdomains(users[loggedInUser].subdomainsCache || {});
          setSubdomainDetails(users[loggedInUser].subdomainDetailsCache || {});
        }
      }
    } else {
      setDomains([]);
      setSelectedDomain(null);
      setSubdomains({});
      setSubdomainDetails({});
    }
  }, [loggedInUser]);

  // Save domain list and caches when they change
  useEffect(() => {
    if (loggedInUser) {
      const usersRaw = localStorage.getItem('osint_users');
      const users: Record<string, UserData> = usersRaw ? JSON.parse(usersRaw) : {};
      
      if (users[loggedInUser]) {
        users[loggedInUser].domains = domains;
        users[loggedInUser].subdomainsCache = subdomains;
        users[loggedInUser].subdomainDetailsCache = subdomainDetails;
        localStorage.setItem('osint_users', JSON.stringify(users));
      }
    }
  }, [domains, subdomains, subdomainDetails, loggedInUser]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    if (isRegisterValid) {
      const usersRaw = localStorage.getItem('osint_users');
      const users: Record<string, UserData> = usersRaw ? JSON.parse(usersRaw) : {};
      
      if (users[email]) {
        setAuthError('Bu e-posta adresi ile zaten bir hesap var.');
        return;
      }
      
      users[email] = { password, domains: [], subdomainsCache: {}, subdomainDetailsCache: {} };
      localStorage.setItem('osint_users', JSON.stringify(users));
      
      setLoggedInUser(email);
      setStep('dashboard');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    if (isLoginValid) {
      const usersRaw = localStorage.getItem('osint_users');
      const users: Record<string, UserData> = usersRaw ? JSON.parse(usersRaw) : {};
      
      if (!users[email] || users[email].password !== password) {
        setAuthError('Hatalı e-posta veya şifre.');
        return;
      }
      
      setLoggedInUser(email);
      setStep('dashboard');
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setStep('login');
  };

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDomainValid && !domains.includes(domainInput)) {
      setDomains([...domains, domainInput]);
      setDomainInput('');
    }
  };

  const handleDeleteDomain = (domainToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const newDomains = domains.filter(d => d !== domainToDelete);
    setDomains(newDomains);
    
    const newSubdomains = { ...subdomains };
    delete newSubdomains[domainToDelete];
    setSubdomains(newSubdomains);
    
    if (selectedDomain === domainToDelete) {
      setSelectedDomain(null);
    }
    
    if (loggedInUser) {
        const usersRaw = localStorage.getItem('osint_users');
        if (usersRaw) {
            const users = JSON.parse(usersRaw);
            users[loggedInUser].domains = newDomains;
            users[loggedInUser].subdomainsCache = newSubdomains;
            localStorage.setItem('osint_users', JSON.stringify(users));
        }
    }
  };

  const fetchSubdomains = async (domain: string, forceRefresh: boolean = false) => {
    if (!forceRefresh && subdomains[domain] && subdomains[domain].length > 0) {
        return;
    }
    
    setLoading(prev => ({ ...prev, [domain]: true }));
    setError(prev => ({ ...prev, [domain]: '' }));
    setWakingUp(prev => ({ ...prev, [domain]: false }));

    // Render uyku modundan uyanıyorsa 3 saniye sonra kullanıcıyı bilgilendir
    const wakeUpTimer = setTimeout(() => {
        setWakingUp(prev => ({ ...prev, [domain]: true }));
    }, 3000);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/crt?q=${domain}`);
      clearTimeout(wakeUpTimer);
      if (!response.ok) {
        throw new Error('crt.sh API yanıt vermedi');
      }
      
      const data: SubdomainData[] = await response.json();
      
      const uniqueSubdomains = new Set<string>();
      data.forEach(item => {
        const parts = item.name_value.split('\n');
        parts.forEach(part => {
          const cleaned = part.trim().toLowerCase();
          const finalDomain = cleaned.startsWith('*.') ? cleaned.substring(2) : cleaned;
          if (finalDomain && finalDomain.endsWith(domain)) {
             uniqueSubdomains.add(finalDomain);
          }
        });
      });
      
      const results = Array.from(uniqueSubdomains).sort();
      setSubdomains(prev => ({ ...prev, [domain]: results }));
      
    } catch (err: any) {
      clearTimeout(wakeUpTimer);
      setError(prev => ({ ...prev, [domain]: 'Subdomainler alınırken bir hata oluştu veya crt.sh geçici olarak ulaşılamıyor.' }));
    } finally {
      clearTimeout(wakeUpTimer);
      setLoading(prev => ({ ...prev, [domain]: false }));
      setWakingUp(prev => ({ ...prev, [domain]: false }));
    }
  };

  const handleDomainClick = (domain: string) => {
    setSelectedDomain(domain);
    fetchSubdomains(domain);
  };

  const handleAnalyzeSubdomain = async (sub: string) => {
    setSubdomainDetails(prev => ({ ...prev, [sub]: { ...prev[sub], analyzing: true } }));
    try {
        const response = await fetch(`${API_BASE_URL}/api/analyze?domain=${sub}`);
        const data = await response.json();
        setSubdomainDetails(prev => ({ 
            ...prev, 
            [sub]: { ip: data.ip, ports: data.ports, isCloudflare: data.isCloudflare, analyzing: false } 
        }));
    } catch (err: any) {
        setSubdomainDetails(prev => ({ 
            ...prev, 
            [sub]: { ip: null, ports: [], isCloudflare: false, analyzing: false } 
        }));
    }
  };

  const handleAnalyzeAll = async () => {
      if (!selectedDomain || !subdomains[selectedDomain]) return;
      const subs = subdomains[selectedDomain];
      
      for (const sub of subs) {
          if (!subdomainDetails[sub] || (subdomainDetails[sub].ip === null && (!subdomainDetails[sub].ports || subdomainDetails[sub].ports!.length === 0))) {
              await handleAnalyzeSubdomain(sub);
          }
      }
  };

  if (step === 'login' || step === 'register') {
    return (
      <div className="login-container">
        <div className="card login-card fade-in">
          <div className="icon-container">
            <div className="icon">
              <svg xmlns="http://www.w3.org/0000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            </div>
          </div>
          <div className="header">
            <h1>Kurumsal OSINT</h1>
            <p>{step === 'login' ? 'Sisteme erişmek için giriş yapın' : 'Yeni bir hesap oluşturun'}</p>
          </div>
          
          {authError && (
            <div className="auth-error">
              {authError}
            </div>
          )}
          
          <form onSubmit={step === 'login' ? handleLogin : handleRegister}>
            <div className="form-group">
              <label htmlFor="email">E-posta Adresi</label>
              <input 
                type="email" 
                id="email" 
                className="form-input" 
                placeholder="isim@sirket.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Şifre</label>
              <input 
                type="password" 
                id="password" 
                className="form-input" 
                placeholder="•••••••• (Min 6 karakter)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {step === 'register' && (
              <div className="form-group fade-in">
                <label htmlFor="confirmPassword">Şifre Tekrar</label>
                <input 
                  type="password" 
                  id="confirmPassword" 
                  className="form-input" 
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}
            
            <button type="submit" className="btn" disabled={step === 'login' ? !isLoginValid : !isRegisterValid}>
              {step === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
            </button>
          </form>

          <div className="auth-switch">
            {step === 'login' ? (
              <p>Hesabınız yok mu? <button className="text-link" onClick={() => { setStep('register'); setAuthError(''); }}>Kayıt Olun</button></p>
            ) : (
              <p>Zaten hesabınız var mı? <button className="text-link" onClick={() => { setStep('login'); setAuthError(''); }}>Giriş Yapın</button></p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="dashboard-layout fade-in">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg xmlns="http://www.w3.org/0000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            <span>OSINT Platform</span>
          </div>
        </div>
        
        <div className="sidebar-content">
          <h3 className="section-title">İncelenecek Domainler</h3>
          
          {domains.length === 0 ? (
            <div className="empty-state">
              <p>Henüz domain eklenmedi.</p>
            </div>
          ) : (
            <ul className="domain-list">
              {domains.map((d, idx) => {
                const isSelected = selectedDomain === d;
                const status = subdomains[d] && subdomains[d].length > 0 ? 'Tamamlandı' : (loading[d] ? 'Taranıyor...' : 'Bekliyor');
                const statusClass = subdomains[d] && subdomains[d].length > 0 ? 'success' : (loading[d] ? 'loading' : 'pending');
                
                return (
                  <li 
                    key={idx} 
                    className={`domain-item clickable ${isSelected ? 'active' : ''}`}
                    onClick={() => handleDomainClick(d)}
                  >
                    <div className="domain-info-group">
                      <span className="domain-icon">🌐</span>
                      <span className="domain-text">{d}</span>
                    </div>
                    <div className="domain-actions-group">
                      <span className={`status-badge ${statusClass}`}>{status}</span>
                      <button 
                        className="delete-btn" 
                        onClick={(e) => handleDeleteDomain(d, e)}
                        title="Sil"
                      >
                        <svg xmlns="http://www.w3.org/0000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        
        <div className="sidebar-footer">
          <div className="user-info-small">
            <span className="user-email-truncate" title={loggedInUser || ''}>{loggedInUser}</span>
          </div>
          <button className="btn-text" onClick={handleLogout}>
            <svg xmlns="http://www.w3.org/0000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Çıkış Yap
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="welcome-text">
            <h2>OSINT Sayfasına Hoş Geldiniz</h2>
            <p>Açık Kaynak İstihbarat platformuna giriş yaptınız. Hedef ekleyin veya incelemek için soldan bir domain seçin.</p>
          </div>
          <div className="user-profile" title={loggedInUser || ''}>
            <div className="avatar">{loggedInUser ? loggedInUser.charAt(0).toUpperCase() : 'U'}</div>
          </div>
        </header>

        <div className="content-area">
          <div className="card input-card">
            <div className="header" style={{ textAlign: 'left' }}>
              <h3>Yeni Hedef Domain Ekle</h3>
              <p>Subdomain taraması ve analiz için şirketin ana alan adını girin.</p>
            </div>
            
            <form onSubmit={handleAddDomain} className="domain-form">
              <div className="form-group mb-0 flex-grow">
                <div className="domain-prefix">
                  <span className="prefix">https://</span>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="sirketadi.com"
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-inline" disabled={!isDomainValid}>
                <svg xmlns="http://www.w3.org/0000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Listeye Ekle
              </button>
            </form>
          </div>

          {!selectedDomain ? (
            <div className="info-card">
              <div className="info-icon">ℹ️</div>
              <div className="info-text">
                <h4>Detaylı Analiz İçin Seçim Yapın</h4>
                <p>Eklediğiniz domainlerin crt.sh veritabanı üzerinden pasif subdomain taramasını başlatmak veya sonuçlarını görüntülemek için sol menüden bir domaine tıklayın. <strong>Girilen veriler hesabınıza özel olarak tarayıcınızda kaydedilir.</strong></p>
              </div>
            </div>
          ) : (
            <div className="card results-card fade-in">
              <div className="results-header">
                <h3>{selectedDomain} - Subdomain & Web Servisi Analizi</h3>
                <div className="results-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {subdomains[selectedDomain] && <span className="results-stats-badge" style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.875rem', fontWeight: '600' }}>{subdomains[selectedDomain].length} kayıt</span>}
                  
                  {subdomains[selectedDomain] && subdomains[selectedDomain].length > 0 && (
                    <button 
                      className="btn btn-inline"
                      onClick={handleAnalyzeAll}
                      style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}
                    >
                      Hepsini Analiz Et
                    </button>
                  )}

                  <button 
                    className="btn-text" 
                    style={{ color: 'var(--primary-color)', fontSize: '0.875rem', padding: '0.25rem 0.5rem', width: 'auto', marginTop: 0 }}
                    onClick={() => fetchSubdomains(selectedDomain, true)}
                    title="Yenile"
                  >
                    <svg xmlns="http://www.w3.org/0000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                    Yenile
                  </button>
                </div>
              </div>
              
              <div className="results-content">
                {loading[selectedDomain] ? (
                  <div className="loading-state">
                    {wakingUp[selectedDomain] ? (
                        <div className="wakeup-container">
                            <div className="wakeup-icon">
                                <svg xmlns="http://www.w3.org/0000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><polyline points="21 3 21 8 16 8"/></svg>
                            </div>
                            <h4>Sunucu Uyanıyor...</h4>
                            <p>Uzun süredir kullanılmadığı için sunucu uyku modundan çıkıyor. Bu işlem <b>~45 saniye</b> sürebilir. Lütfen bekleyin.</p>
                            <div className="progress-bar-container">
                                <div className="progress-bar-fill"></div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="spinner"></div>
                            <p>crt.sh üzerinden sertifika şeffaflık logları taranıyor...</p>
                        </>
                    )}
                  </div>
                ) : error[selectedDomain] ? (
                  <div className="error-state">
                    <svg xmlns="http://www.w3.org/0000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <p>{error[selectedDomain]}</p>
                    <button className="btn btn-inline" onClick={() => fetchSubdomains(selectedDomain, true)}>Tekrar Dene</button>
                  </div>
                ) : subdomains[selectedDomain] && subdomains[selectedDomain].length > 0 ? (
                  <div className="subdomain-list">
                    {subdomains[selectedDomain].map((sub, idx) => {
                      const detail = subdomainDetails[sub];

                      return (
                        <div key={idx} className="subdomain-item-detailed">
                          <div className="sub-main-info">
                            <svg xmlns="http://www.w3.org/0000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="subdomain-icon"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                            <a href={`https://${sub}`} target="_blank" rel="noopener noreferrer">{sub}</a>
                          </div>
                          
                          <div className="sub-details">
                            {detail?.analyzing ? (
                                <span className="analyzing-text">Web servisleri kontrol ediliyor...</span>
                            ) : detail ? (
                                <div className="detail-rows">
                                  <div className="detail-row">
                                    <span className="ip-badge">{detail.ip || 'DNS Çözülemedi'}</span>
                                    {detail.isCloudflare && (
                                      <span className="cf-badge" title="Cloudflare Koruması Aktif">
                                        <svg xmlns="http://www.w3.org/0000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M17.5 19c2.5 0 4.5-2 4.5-4.5a4.5 4.5 0 0 0-4-4.43V10a5 5 0 0 0-9.8-1.4 3.5 3.5 0 0 0-5.7 2.4A4.5 4.5 0 0 0 6.5 19h11Z"/></svg>
                                        Cloudflare
                                      </span>
                                    )}
                                  </div>
                                  
                                  {detail.ports && detail.ports.length > 0 ? (
                                    <div className="ports-container">
                                        {detail.ports.map((p, pIdx) => {
                                            let statusBadgeClass = 'status-badge-gray';
                                            if (p.status === 200 || p.status === 201) statusBadgeClass = 'status-badge-green';
                                            else if (String(p.status).startsWith('3')) statusBadgeClass = 'status-badge-blue';
                                            else if (String(p.status).startsWith('4') || String(p.status).startsWith('5')) statusBadgeClass = 'status-badge-red';
                                            else statusBadgeClass = 'status-badge-gray';

                                            const scheme = p.protocol === 'https:' ? 'https' : 'http';
                                            const portStr = (scheme === 'https' && p.port === 443) || (scheme === 'http' && p.port === 80) ? '' : `:${p.port}`;
                                            const targetUrl = `${scheme}://${sub}${portStr}`;

                                            return (
                                                <a 
                                                    key={pIdx} 
                                                    href={targetUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="port-badge-group clickable-port"
                                                    title={`${targetUrl} adresine git`}
                                                >
                                                    <span className="port-number">:{p.port}</span>
                                                    <span className={`status-badge-detailed ${statusBadgeClass}`}>{p.status}</span>
                                                </a>
                                            );
                                        })}
                                    </div>
                                  ) : (
                                      <span className="no-ports-text">Açık web servisi bulunamadı</span>
                                  )}
                                </div>
                            ) : (
                                <button className="btn-text btn-small" onClick={() => handleAnalyzeSubdomain(sub)}>
                                  Web Servisi Kontrolü
                                </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>Bu alan adı için herhangi bir kayıt bulunamadı veya henüz tarama yapılmadı.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
