import React from 'react';
import type { AssessmentData } from '../../../types/assessment';
import { Checkbox, Input } from '../../ui';

interface StepProps {
  data: AssessmentData;
  updateData: (updates: Partial<AssessmentData>) => void;
}

export const Step6: React.FC<StepProps> = ({ data, updateData }) => {
  const incidents = [
    { key: 'hasRansomwareIncident', label: 'Ransomware Incident' },
    { key: 'hasPhishingIncident', label: 'Significant Phishing / Social Engineering' },
    { key: 'hasDataBreach', label: 'Data Breach (Unauthorized Data Access)' },
  ];

  return (
    <div className="step-content">
      <div className="grid-2">
        <Input 
          label="Incidents in last 12 months (Count)"
          type="number"
          value={data.incidentCountLast12Months}
          onChange={(e) => updateData({ incidentCountLast12Months: e.target.value })}
          placeholder="0"
        />
        <Input 
          label="Mean Time to Detect (MTTD)"
          value={data.mttd}
          onChange={(e) => updateData({ mttd: e.target.value })}
          placeholder="e.g. 2 days"
        />
      </div>

      <p className="field-label">Has the organization experienced any of these in the last 24 months?</p>
      <div className="checkbox-grid">
        {incidents.map((incident) => (
          <Checkbox 
            key={incident.key}
            label={incident.label}
            checked={data[incident.key as keyof AssessmentData] as boolean}
            onChange={(e) => updateData({ [incident.key]: e.target.checked })}
          />
        ))}
      </div>

      <div className="form-group" style={{ marginTop: '1.5rem' }}>
        <label className="form-label">Top 3 Cybersecurity Risks for your Organization</label>
        <textarea 
          className="form-input textarea"
          value={data.majorRisks}
          onChange={(e) => updateData({ majorRisks: e.target.value })}
          placeholder="1. Ransomware&#10;2. Third-party risk&#10;3. Lack of skilled staff"
          rows={4}
        />
      </div>

      <style>{`
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .field-label {
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.75rem;
        }
        
        .checkbox-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.5rem;
        }
        
        .textarea {
          resize: vertical;
          min-height: 100px;
        }
        
        @media (max-width: 640px) {
          .grid-2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
