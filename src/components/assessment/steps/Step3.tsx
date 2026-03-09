import React from 'react';
import type { AssessmentData } from '../../../types/assessment';
import { Checkbox } from '../../ui';

interface StepProps {
  data: AssessmentData;
  updateData: (updates: Partial<AssessmentData>) => void;
}

export const Step3: React.FC<StepProps> = ({ data, updateData }) => {
  const policies = [
    { key: 'hasSecurityPolicy', label: 'Formal Information Security Policy (ISP)' },
    { key: 'hasCyberStrategy', label: 'Cybersecurity Strategy / Roadmap' },
    { key: 'hasRiskManagement', label: 'Risk Management Framework' },
    { key: 'hasIncidentResponsePlan', label: 'Incident Response Plan (IRP)' },
    { key: 'hasBusinessContinuityPlan', label: 'Business Continuity / Disaster Recovery Plan' },
    { key: 'hasAssetInventory', label: 'Maintained IT Asset Inventory' },
    { key: 'hasDataClassification', label: 'Data Classification Policy' },
    { key: 'hasSecurityAwarenessProgram', label: 'Security Awareness Training for Employees' },
  ];

  return (
    <div className="step-content">
      <p className="step-description">Which of the following governance and policy elements are currently in place?</p>
      
      <div className="checkbox-grid">
        {policies.map((policy) => (
          <Checkbox 
            key={policy.key}
            label={policy.label}
            checked={data[policy.key as keyof AssessmentData] as boolean}
            onChange={(e) => updateData({ [policy.key]: e.target.checked })}
          />
        ))}
      </div>

      <style>{`
        .step-description {
          margin-bottom: 1.5rem;
          color: var(--text-muted);
        }
        
        .checkbox-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.5rem;
        }
      `}</style>
    </div>
  );
};
