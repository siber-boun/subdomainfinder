import React from 'react';
import type { AssessmentData } from '../types/assessment';
import { Card, Button } from '../components/ui';

interface SummaryPageProps {
  data: AssessmentData;
  onEdit: () => void;
}

export const SummaryPage: React.FC<SummaryPageProps> = ({ data, onEdit }) => {
  const getMaturityColor = (level: string) => {
    switch (level) {
      case 'Initial': return '#ef4444';
      case 'Developing': return '#f59e0b';
      case 'Defined': return '#3b82f6';
      case 'Managed': return '#8b5cf6';
      case 'Optimized': return '#10b981';
      default: return 'var(--text-muted)';
    }
  };

  const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="summary-section">
      <h3>{title}</h3>
      <div className="summary-grid">
        {children}
      </div>
    </div>
  );

  const Item: React.FC<{ label: string; value: string | boolean | string[] }> = ({ label, value }) => {
    let displayValue = '';
    if (typeof value === 'boolean') {
      displayValue = value ? '✅ Yes' : '❌ No';
    } else if (Array.isArray(value)) {
      displayValue = value.length > 0 ? value.join(', ') : 'None';
    } else {
      displayValue = value || 'Not specified';
    }

    return (
      <div className="summary-item">
        <span className="item-label">{label}</span>
        <span className="item-value">{displayValue}</span>
      </div>
    );
  };

  return (
    <div className="summary-page fade-in">
      <div className="summary-header">
        <h1>Assessment Summary</h1>
        <div className="header-actions">
          <Button variant="outline" onClick={onEdit}>Edit Assessment</Button>
          <Button variant="secondary" onClick={() => window.print()}>Download Report (PDF)</Button>
        </div>
      </div>

      <div className="summary-dashboard">
        <Card className="maturity-card">
          <div className="maturity-label">Estimated Maturity Level</div>
          <div 
            className="maturity-value" 
            style={{ color: getMaturityColor(data.selfAssessedMaturity) }}
          >
            {data.selfAssessedMaturity}
          </div>
          <div className="maturity-description">
            Based on your self-assessment and technical controls provided.
          </div>
        </Card>

        <Card className="stats-card">
          <div className="stat-item">
            <span className="stat-val">{data.employeeCount || '0'}</span>
            <span className="stat-label">Employees</span>
          </div>
          <div className="stat-item">
            <span className="stat-val">{data.endpointCount || '0'}</span>
            <span className="stat-label">Endpoints</span>
          </div>
          <div className="stat-item">
            <span className="stat-val">{data.compliances.length}</span>
            <span className="stat-label">Standards</span>
          </div>
        </Card>
      </div>

      <Card className="details-card">
        <Section title="Organization Profile">
          <Item label="Company" value={data.companyName} />
          <Item label="Industry" value={data.industry} />
          <Item label="Type" value={data.companyType} />
          <Item label="IT Staff" value={data.itStaffCount} />
          <Item label="Security Staff" value={data.cyberSecurityStaffCount} />
        </Section>

        <Section title="Governance & Compliance">
          <Item label="Security Policy" value={data.hasSecurityPolicy} />
          <Item label="IR Plan" value={data.hasIncidentResponsePlan} />
          <Item label="Data Protection" value={data.gdprKvkkCompliance} />
          <Item label="Standards" value={data.compliances} />
        </Section>

        <Section title="Technical Controls">
          <Item label="MFA Usage" value={data.mfaUsage} />
          <Item label="EDR/AV" value={data.edrUsage} />
          <Item label="SIEM" value={data.siemUsage} />
          <Item label="Network Seg." value={data.networkSegmentation} />
        </Section>

        <Section title="Strategy & Outlook">
          <Item label="Leadership Support" value={data.leadershipSupport} />
          <Item label="Budget" value={data.budgetSufficiency} />
        </Section>
        
        <div className="summary-long-text">
          <h4>Top Priorities</h4>
          <p>{data.topPriorities || 'No priorities specified.'}</p>
        </div>
      </Card>

      <style>{`
        .summary-page {
          max-width: 1000px;
          margin: 3rem auto;
          padding: 0 1.5rem;
        }
        
        .summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2.5rem;
        }
        
        .summary-header h1 {
          font-size: 2.25rem;
          font-weight: 800;
          color: var(--primary);
        }
        
        .header-actions {
          display: flex;
          gap: 1rem;
        }
        
        .summary-dashboard {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .maturity-card {
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: var(--primary);
          color: white;
        }
        
        .maturity-label {
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.8;
          margin-bottom: 0.5rem;
        }
        
        .maturity-value {
          font-size: 3rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
        }
        
        .maturity-description {
          font-size: 0.875rem;
          opacity: 0.7;
        }
        
        .stats-card {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          align-items: center;
        }
        
        .stat-item {
          text-align: center;
        }
        
        .stat-val {
          display: block;
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--accent);
        }
        
        .stat-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 600;
        }
        
        .summary-section {
          margin-bottom: 2rem;
        }
        
        .summary-section h3 {
          font-size: 1.125rem;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.5rem;
          margin-bottom: 1rem;
          color: var(--primary);
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1.5rem;
        }
        
        .summary-item {
          display: flex;
          flex-direction: column;
        }
        
        .item-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-bottom: 0.25rem;
        }
        
        .item-value {
          font-weight: 600;
          font-size: 0.9375rem;
        }
        
        .summary-long-text {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border);
        }
        
        .summary-long-text h4 {
          margin-bottom: 0.5rem;
        }
        
        @media (max-width: 768px) {
          .summary-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1.5rem;
          }
          
          .summary-dashboard {
            grid-template-columns: 1fr;
          }
        }
        
        @media print {
          .header-actions { display: none; }
          .summary-page { margin: 0; padding: 20px; }
          .card-ui { box-shadow: none; border: 1px solid #eee; }
        }
      `}</style>
    </div>
  );
};
