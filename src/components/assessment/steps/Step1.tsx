import React from 'react';
import type { AssessmentData, CompanyType } from '../../../types/assessment';
import { Input, Select, Checkbox } from '../../ui';

interface StepProps {
  data: AssessmentData;
  updateData: (updates: Partial<AssessmentData>) => void;
}

export const Step1: React.FC<StepProps> = ({ data, updateData }) => {
  const companyTypes: { label: string; value: CompanyType }[] = [
    { label: 'SME (< 250 employees)', value: 'SME' },
    { label: 'Mid-size (250 - 1000 employees)', value: 'Mid-size' },
    { label: 'Large enterprise (> 1000 employees)', value: 'Large enterprise' },
  ];

  return (
    <div className="step-content">
      <div className="grid-2">
        <Input 
          label="Company Name"
          value={data.companyName}
          onChange={(e) => updateData({ companyName: e.target.value })}
          placeholder="Acme Corp"
        />
        <Input 
          label="Country"
          value={data.country}
          onChange={(e) => updateData({ country: e.target.value })}
          placeholder="United States"
        />
      </div>

      <div className="grid-2">
        <Input 
          label="Industry / Sector"
          value={data.industry}
          onChange={(e) => updateData({ industry: e.target.value })}
          placeholder="e.g. Finance, Healthcare"
        />
        <Select 
          label="Company Type"
          value={data.companyType}
          onChange={(e) => updateData({ companyType: e.target.value as CompanyType })}
          options={companyTypes}
        />
      </div>

      <div className="grid-2">
        <Input 
          label="Total Employee Count"
          type="number"
          value={data.employeeCount}
          onChange={(e) => updateData({ employeeCount: e.target.value })}
          placeholder="e.g. 150"
        />
        <Input 
          label="Annual Revenue Range"
          value={data.revenueRange}
          onChange={(e) => updateData({ revenueRange: e.target.value })}
          placeholder="e.g. $10M - $50M"
        />
      </div>

      <div className="grid-2">
        <Input 
          label="IT Staff Count"
          type="number"
          value={data.itStaffCount}
          onChange={(e) => updateData({ itStaffCount: e.target.value })}
          placeholder="e.g. 5"
        />
        <Input 
          label="Cybersecurity Staff Count"
          type="number"
          value={data.cyberSecurityStaffCount}
          onChange={(e) => updateData({ cyberSecurityStaffCount: e.target.value })}
          placeholder="e.g. 1"
        />
      </div>

      <Checkbox 
        label="Organization has multiple branches or locations"
        checked={data.hasMultipleBranches}
        onChange={(e) => updateData({ hasMultipleBranches: e.target.checked })}
      />

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
