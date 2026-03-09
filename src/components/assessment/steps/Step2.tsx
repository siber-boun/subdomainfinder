import React from 'react';
import type { AssessmentData } from '../../../types/assessment';
import { Input, Select } from '../../ui';

interface StepProps {
  data: AssessmentData;
  updateData: (updates: Partial<AssessmentData>) => void;
}

export const Step2: React.FC<StepProps> = ({ data, updateData }) => {
  const infraTypes: { label: string; value: AssessmentData['infrastructureType'] }[] = [
    { label: 'On-premise Only', value: 'On-premise' },
    { label: 'Cloud Only', value: 'Cloud' },
    { label: 'Hybrid (Cloud + On-premise)', value: 'Hybrid' },
  ];

  return (
    <div className="step-content">
      <div className="grid-2">
        <Input 
          label="Total Endpoints (Laptops, Desktops)"
          type="number"
          value={data.endpointCount}
          onChange={(e) => updateData({ endpointCount: e.target.value })}
          placeholder="e.g. 200"
        />
        <Input 
          label="Total Servers"
          type="number"
          value={data.serverCount}
          onChange={(e) => updateData({ serverCount: e.target.value })}
          placeholder="e.g. 15"
        />
      </div>

      <div className="grid-2">
        <Select 
          label="Primary Infrastructure Type"
          value={data.infrastructureType}
          onChange={(e) => updateData({ infrastructureType: e.target.value as any })}
          options={infraTypes}
        />
        <Input 
          label="SaaS Usage Level"
          value={data.saasUsage}
          onChange={(e) => updateData({ saasUsage: e.target.value })}
          placeholder="e.g. High (Most apps are SaaS)"
        />
      </div>

      <Input 
        label="Critical Systems (List comma separated)"
        value={data.criticalSystems.join(', ')}
        onChange={(e) => updateData({ criticalSystems: e.target.value.split(',').map(s => s.trim()) })}
        placeholder="ERP, CRM, Email, Financial Systems"
        helperText="List the systems most critical to your business operations"
      />

      <div className="grid-2">
        <Input 
          label="Remote Work Level (%)"
          type="number"
          value={data.remoteWorkLevel}
          onChange={(e) => updateData({ remoteWorkLevel: e.target.value })}
          placeholder="e.g. 50"
        />
        <Input 
          label="Third-party Dependency"
          value={data.thirdPartyDependency}
          onChange={(e) => updateData({ thirdPartyDependency: e.target.value })}
          placeholder="e.g. High (Critical for daily ops)"
        />
      </div>

      <style>{`
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
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
