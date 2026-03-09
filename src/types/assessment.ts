export type CompanyType = 'SME' | 'Mid-size' | 'Large enterprise';
export type MaturityLevel = 'Initial' | 'Developing' | 'Defined' | 'Managed' | 'Optimized';

export interface AssessmentData {
  // Step 1: Organization Profile
  companyName: string;
  industry: string;
  country: string;
  employeeCount: string;
  revenueRange: string;
  itStaffCount: string;
  cyberSecurityStaffCount: string;
  companyType: CompanyType;
  hasMultipleBranches: boolean;

  // Step 2: Digital Environment
  endpointCount: string;
  serverCount: string;
  infrastructureType: 'On-premise' | 'Cloud' | 'Hybrid';
  saasUsage: string;
  criticalSystems: string[]; // ERP, CRM, etc.
  remoteWorkLevel: string;
  thirdPartyDependency: string;

  // Step 3: Governance and Policy
  hasSecurityPolicy: boolean;
  hasCyberStrategy: boolean;
  hasRiskManagement: boolean;
  hasIncidentResponsePlan: boolean;
  hasBusinessContinuityPlan: boolean;
  hasAssetInventory: boolean;
  hasDataClassification: boolean;
  hasSecurityAwarenessProgram: boolean;

  // Step 4: Technical Security Controls
  mfaUsage: 'None' | 'Partial' | 'Full';
  edrUsage: boolean;
  siemUsage: boolean;
  vulnerabilityScanning: boolean;
  patchManagement: string;
  backupPractices: string;
  networkSegmentation: boolean;
  emailSecurity: boolean;
  pamUsage: boolean;
  encryptionPractices: string;

  // Step 5: Compliance and Standards
  compliances: string[]; // ISO 27001, NIST, etc.
  gdprKvkkCompliance: boolean;
  auditFrequency: string;

  // Step 6: Incident and Risk History
  incidentCountLast12Months: string;
  hasRansomwareIncident: boolean;
  hasPhishingIncident: boolean;
  hasDataBreach: boolean;
  mttd: string; // Mean Time to Detect
  majorRisks: string;

  // Step 7: Maturity Perception
  selfAssessedMaturity: MaturityLevel;
  mainChallenges: string;
  topPriorities: string;
  budgetSufficiency: string;
  leadershipSupport: string;
}

export type AppStep = 'login' | 'assessment' | 'summary';
export type AssessmentStepId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
