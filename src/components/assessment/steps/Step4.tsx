import React from 'react';
import type { AssessmentData } from '../../../types/assessment';
import { Checkbox, Select, Input } from '../../ui';

interface StepProps {
  data: AssessmentData;
  updateData: (updates: Partial<AssessmentData>) => void;
}

export const Step4: React.FC<StepProps> = ({ data, updateData }) => {
  const mfaOptions = [
    { label: 'None', value: 'None' },
    { label: 'Partial (Critical systems only)', value: 'Partial' },
    { label: 'Full (All systems)', value: 'Full' },
  ];

  const controls = [
    { key: 'edrUsage', label: 'EDR/AV (Endpoint Detection & Response)' },
    { key: 'siemUsage', label: 'SIEM / Log Management' },
    { key: 'vulnerabilityScanning', label: 'Regular Vulnerability Scanning' },
    { key: 'networkSegmentation', label: 'Network Segmentation' },
    { key: 'emailSecurity', label: 'Email Security (Spam filter, Sandboxing)' },
    { key: 'pamUsage', label: 'Privileged Access Management (PAM)' },
  ];

  return (
    <div className="step-content">
      <div className="grid-2">
        <Select 
          label="Multi-Factor Authentication (MFA)"
          value={data.mfaUsage}
          onChange={(e) => updateData({ mfaUsage: e.target.value as any })}
          options={mfaOptions}
        />
        <Input 
          label="Patch Management Frequency"
          value={data.patchManagement}
          onChange={(e) => updateData({ patchManagement: e.target.value })}
          placeholder="e.g. Monthly"
        />
      </div>

      <div className="grid-2">
        <Input 
          label="Backup Practices"
          value={data.backupPractices}
          onChange={(e) => updateData({ backupPractices: e.target.value })}
          placeholder="e.g. Daily offsite"
        />
        <Input 
          label="Encryption Practices"
          value={data.encryptionPractices}
          onChange={(e) => updateData({ encryptionPractices: e.target.value })}
          placeholder="e.g. Full disk encryption"
        />
      </div>

      <div className="checkbox-grid">
        {controls.map((control) => (
          <Checkbox 
            key={control.key}
            label={control.label}
            checked={data[control.key as keyof AssessmentData] as boolean}
            onChange={(e) => updateData({ [control.key]: e.target.checked })}
          />
        ))}
      </div>

      <style>{`
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1rem;
        }
        
        .checkbox-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          margin-top: 1rem;
        }
        
        @media (max-width: 640px) {
          .grid-2, .checkbox-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
