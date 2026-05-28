export const calcEMI = (principal, annualRate, months) => {
  if (!principal || !annualRate || !months) return { emi: 0, total: 0, interest: 0 };
  const r = annualRate / 12 / 100;
  const emi = r > 0
    ? (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
    : principal / months;
  const total = emi * months;
  const interest = total - principal;
  return {
    emi: Math.round(emi),
    total: Math.round(total),
    interest: Math.round(interest),
  };
};

export const calcLTV = (loanAmount, propertyValue) => {
  if (!propertyValue) return 0;
  return parseFloat(((loanAmount / propertyValue) * 100).toFixed(1));
};

export const calcFOIR = (emi, obligations, income) => {
  if (!income) return 0;
  return parseFloat((((emi + obligations) / income) * 100).toFixed(1));
};

export const formatINR = (amount) => {
  if (!amount) return '₹0';
  return '₹' + Number(amount).toLocaleString('en-IN');
};

export const getLTVStatus = (ltv) => {
  if (ltv <= 50) return { label: 'Very Safe', color: '#10b981' };
  if (ltv <= 65) return { label: 'Optimal', color: '#06b6d4' };
  if (ltv <= 75) return { label: 'High', color: '#f59e0b' };
  return { label: 'Critical', color: '#f43f5e' };
};

export const getCIBILStatus = (score) => {
  if (score >= 750) return { label: 'Excellent', color: '#10b981', cls: 'cibil-excellent' };
  if (score >= 650) return { label: 'Good', color: '#06b6d4', cls: 'cibil-good' };
  if (score > 0) return { label: 'Fair', color: '#f59e0b', cls: 'cibil-fair' };
  return { label: 'Pending', color: '#f43f5e', cls: 'cibil-poor' };
};

export const LAP_STAGES = [
  { id: 'in-principle', name: 'In-Principle Sanction', icon: '📋', color: '#f59e0b' },
  { id: 'property-appraisal', name: 'Property Appraisal', icon: '🏠', color: '#06b6d4' },
  { id: 'legal-tech', name: 'Legal & Technical', icon: '⚖️', color: '#8b5cf6' },
  { id: 'final-underwriting', name: 'Final Underwriting', icon: '✅', color: '#10b981' },
  { id: 'disbursed', name: 'Disbursed', icon: '💳', color: '#6366f1' },
];

export const generateAmortizationTable = (principal, annualRate, months) => {
  const r = annualRate / 12 / 100;
  const emi = r > 0
    ? (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
    : principal / months;
  const schedule = [];
  let balance = principal;
  for (let i = 1; i <= months; i++) {
    const interest = balance * r;
    const principalPart = emi - interest;
    balance -= principalPart;
    schedule.push({
      month: i, emi: Math.round(emi), principal: Math.round(principalPart),
      interest: Math.round(interest), balance: Math.round(Math.max(0, balance))
    });
  }
  return schedule;
};