import React from 'react';
import type { AssessmentData } from '../../../types/assessment';
import { Checkbox, Input } from '../../ui';

interface StepProps {
  data: AssessmentData;
  updateData: (updates: Partial<AssessmentData>) => void;
}

export const Step5: React.FC<StepProps> = ({ data, updateData }) => {
  const complianceOptions = [
    'ISO 27001',
    'NIST CSF',
    'SOC2',
    'PCI DSS',
    'HIPAA',
    'CIS Controls'
  ];

  const handleComplianceChange = (comp: string, checked: boolean) => {
    const current = [...data.compliances];
    if (checked) {
      updateData({ compliances: [...current, comp] });
    } else {
      updateData({ compliances: current.filter(c => c !== comp) });
    }
  };

  return (
    <div className="step-content">
      <p className="step-description">Which cybersecurity standards or frameworks do you follow?</p>
      
      <div className="checkbox-grid">
        {complianceOptions.map((comp) => (
          <Checkbox 
            key={comp}
            label={comp}
            checked={data.compliances.includes(comp)}
            onChange={(e) => handleComplianceChange(comp, e.target.checked)}
          />
        ))}
      </div>

      <div className="divider" />

      <Checkbox 
        label="GDPR / Local Data Protection Law Compliance (KVKK, etc.)"
        checked={data.gdprKvkkCompliance}
        onChange={(e) => updateData({ gdprKvkkCompliance: e.target.checked })}
      />

      <Input 
        label="External Audit Frequency"
        value={data.auditFrequency}
        onChange={(e) => updateData({ auditFrequency: e.target.value })}
        placeholder="e.g. Annually"
      />

      <style>{`
        .step-description {
          margin-bottom: 1.5rem;
          color: var(--text-muted);
        }
        
        .checkbox-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          margin-bottom: 2rem;
        }
        
        .divider {
          height: 1px;
          background: var(--border);
          margin: 1.5rem 0;
        }
        
        @media (max-width: 640px) {
          .checkbox-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
