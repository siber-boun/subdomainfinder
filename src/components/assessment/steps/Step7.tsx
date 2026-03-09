import React from 'react';
import type { AssessmentData, MaturityLevel } from '../../../types/assessment';
import { Select } from '../../ui';

interface StepProps {
  data: AssessmentData;
  updateData: (updates: Partial<AssessmentData>) => void;
}

export const Step7: React.FC<StepProps> = ({ data, updateData }) => {
  const levels: { label: string; value: MaturityLevel }[] = [
    { label: 'Level 1: Initial (Ad-hoc, unorganized)', value: 'Initial' },
    { label: 'Level 2: Developing (Consistent but undocumented)', value: 'Developing' },
    { label: 'Level 3: Defined (Documented and standardized)', value: 'Defined' },
    { label: 'Level 4: Managed (Measured and controlled)', value: 'Managed' },
    { label: 'Level 5: Optimized (Continuous improvement)', value: 'Optimized' },
  ];

  const options = [
    { label: 'Very Low', value: 'Very Low' },
    { label: 'Low', value: 'Low' },
    { label: 'Moderate', value: 'Moderate' },
    { label: 'High', value: 'High' },
    { label: 'Very High', value: 'Very High' },
  ];

  return (
    <div className="step-content">
      <Select 
        label="Self-Assessed Cyber Maturity Level"
        value={data.selfAssessedMaturity}
        onChange={(e) => updateData({ selfAssessedMaturity: e.target.value as MaturityLevel })}
        options={levels}
        helperText="Choose the level that best describes your organization's current state"
      />

      <div className="grid-2">
        <Select 
          label="Budget Sufficiency"
          value={data.budgetSufficiency}
          onChange={(e) => updateData({ budgetSufficiency: e.target.value })}
          options={options}
        />
        <Select 
          label="Leadership Support / Buy-in"
          value={data.leadershipSupport}
          onChange={(e) => updateData({ leadershipSupport: e.target.value })}
          options={options}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Main Cybersecurity Challenges</label>
        <textarea 
          className="form-input textarea"
          value={data.mainChallenges}
          onChange={(e) => updateData({ mainChallenges: e.target.value })}
          placeholder="e.g. Budget constraints, lack of specialized talent, legacy systems"
          rows={3}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Top Cybersecurity Priorities for the next 12 months</label>
        <textarea 
          className="form-input textarea"
          value={data.topPriorities}
          onChange={(e) => updateData({ topPriorities: e.target.value })}
          placeholder="e.g. Implementing Zero Trust, Cloud security migration, MFA rollout"
          rows={3}
        />
      </div>

      <style>{`
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1rem;
        }
        
        .textarea {
          resize: vertical;
          min-height: 80px;
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
