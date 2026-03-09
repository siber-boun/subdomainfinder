import { useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { AssessmentWizard } from './components/assessment/AssessmentWizard';
import { SummaryPage } from './pages/SummaryPage';
import type { AppStep, AssessmentData } from './types/assessment';
import './App.css';

function App() {
  const [step, setStep] = useState<AppStep>('login');
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);

  const handleLogin = () => {
    setStep('assessment');
  };

  const handleAssessmentComplete = (data: AssessmentData) => {
    setAssessmentData(data);
    setStep('summary');
  };

  const handleBackToEdit = () => {
    setStep('assessment');
  };

  return (
    <main className="app-container">
      {step === 'login' && <LoginPage onLogin={handleLogin} />}
      
      {step === 'assessment' && (
        <div className="fade-in">
          <AssessmentWizard onComplete={handleAssessmentComplete} />
        </div>
      )}
      
      {step === 'summary' && assessmentData && (
        <SummaryPage data={assessmentData} onEdit={handleBackToEdit} />
      )}
    </main>
  );
}

export default App;
