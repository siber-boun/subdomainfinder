import React, { useState } from 'react';
import type { AssessmentData, AssessmentStepId } from '../../types/assessment';
import { Card, Button, ProgressBar } from '../ui';
import { Step1 } from './steps/Step1';
import { Step2 } from './steps/Step2';
import { Step3 } from './steps/Step3';
import { Step4 } from './steps/Step4';
import { Step5 } from './steps/Step5';
import { Step6 } from './steps/Step6';
import { Step7 } from './steps/Step7';

interface AssessmentWizardProps {
  onComplete: (data: AssessmentData) => void;
}

const INITIAL_DATA: AssessmentData = {
  companyName: '',
  industry: '',
  country: '',
  employeeCount: '',
  revenueRange: '',
  itStaffCount: '',
  cyberSecurityStaffCount: '',
  companyType: 'SME',
  hasMultipleBranches: false,
  endpointCount: '',
  serverCount: '',
  infrastructureType: 'Cloud',
  saasUsage: '',
  criticalSystems: [],
  remoteWorkLevel: '',
  thirdPartyDependency: '',
  hasSecurityPolicy: false,
  hasCyberStrategy: false,
  hasRiskManagement: false,
  hasIncidentResponsePlan: false,
  hasBusinessContinuityPlan: false,
  hasAssetInventory: false,
  hasDataClassification: false,
  hasSecurityAwarenessProgram: false,
  mfaUsage: 'None',
  edrUsage: false,
  siemUsage: false,
  vulnerabilityScanning: false,
  patchManagement: '',
  backupPractices: '',
  networkSegmentation: false,
  emailSecurity: false,
  pamUsage: false,
  encryptionPractices: '',
  compliances: [],
  gdprKvkkCompliance: false,
  auditFrequency: '',
  incidentCountLast12Months: '',
  hasRansomwareIncident: false,
  hasPhishingIncident: false,
  hasDataBreach: false,
  mttd: '',
  majorRisks: '',
  selfAssessedMaturity: 'Initial',
  mainChallenges: '',
  topPriorities: '',
  budgetSufficiency: '',
  leadershipSupport: ''
};

export const AssessmentWizard: React.FC<AssessmentWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<AssessmentStepId>(1);
  const [data, setData] = useState<AssessmentData>(INITIAL_DATA);

  const updateData = (updates: Partial<AssessmentData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < 7) {
      setCurrentStep((prev) => (prev + 1) as AssessmentStepId);
    } else {
      onComplete(data);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => (prev - 1) as AssessmentStepId);
  };

  const stepTitles = [
    'Organization Profile',
    'Digital Environment',
    'Governance and Policy',
    'Technical Controls',
    'Compliance and Standards',
    'Incident History',
    'Maturity Perception'
  ];

  return (
    <div className="assessment-wizard fade-in">
      <div className="wizard-header">
        <div className="wizard-title">
          <span className="step-count">Step {currentStep} of 7</span>
          <h2>{stepTitles[currentStep - 1]}</h2>
        </div>
        <ProgressBar progress={(currentStep / 7) * 100} />
      </div>

      <Card className="step-card">
        {currentStep === 1 && <Step1 data={data} updateData={updateData} />}
        {currentStep === 2 && <Step2 data={data} updateData={updateData} />}
        {currentStep === 3 && <Step3 data={data} updateData={updateData} />}
        {currentStep === 4 && <Step4 data={data} updateData={updateData} />}
        {currentStep === 5 && <Step5 data={data} updateData={updateData} />}
        {currentStep === 6 && <Step6 data={data} updateData={updateData} />}
        {currentStep === 7 && <Step7 data={data} updateData={updateData} />}

        <div className="wizard-footer">
          <Button 
            variant="outline" 
            onClick={prevStep} 
            disabled={currentStep === 1}
          >
            Back
          </Button>
          <Button 
            variant="primary" 
            onClick={nextStep}
          >
            {currentStep === 7 ? 'View Summary' : 'Next Step'}
          </Button>
        </div>
      </Card>

      <style>{`
        .assessment-wizard {
          max-width: 800px;
          margin: 2rem auto;
          padding: 0 1rem;
        }
        
        .wizard-header {
          margin-bottom: 2rem;
        }
        
        .wizard-title {
          margin-bottom: 1.5rem;
        }
        
        .step-count {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .wizard-title h2 {
          font-size: 1.875rem;
          font-weight: 700;
          color: var(--primary);
        }
        
        .step-card {
          min-height: 400px;
          display: flex;
          flex-direction: column;
        }
        
        .wizard-footer {
          margin-top: 3rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
        }
      `}</style>
    </div>
  );
};
