import React from 'react';
import './UI.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  return (
    <button 
      className={`btn btn-${variant} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, helperText, className = '', ...props }) => {
  return (
    <div className={`form-group ${className}`}>
      {label && <label className="form-label">{label}</label>}
      <input 
        className={`form-input ${error ? 'input-error' : ''}`}
        {...props}
      />
      {error && <p className="error-text">{error}</p>}
      {helperText && !error && <p className="helper-text">{helperText}</p>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { label: string; value: string }[];
  error?: string;
  helperText?: string;
}

export const Select: React.FC<SelectProps> = ({ label, options, error, helperText, className = '', ...props }) => {
  return (
    <div className={`form-group ${className}`}>
      {label && <label className="form-label">{label}</label>}
      <select 
        className={`form-input ${error ? 'input-error' : ''}`}
        {...props}
      >
        <option value="" disabled>Select an option</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="error-text">{error}</p>}
      {helperText && !error && <p className="helper-text">{helperText}</p>}
    </div>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`card-ui ${className}`}>
    {children}
  </div>
);

export const Checkbox: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
  <label className="checkbox-label">
    <input type="checkbox" className="checkbox-input" {...props} />
    <span>{label}</span>
  </label>
);

export const Radio: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
  <label className="radio-label">
    <input type="radio" className="radio-input" {...props} />
    <span>{label}</span>
  </label>
);

export const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
  <div className="progress-container">
    <div className="progress-bar-wrapper">
      <div 
        className="progress-fill" 
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
);
