const mongoose = require('mongoose');

const coApplicantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  income: { type: Number, required: true },
  cibil: { type: Number, required: true },
  relation: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
});

const applicantSchema = new mongoose.Schema({
  // Basic Info
  lapAppNo: { type: String, unique: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  pan: { type: String, uppercase: true },
  aadhaar: { type: String },
  category: { type: String, enum: ['General Class', 'Business Owner', 'Self Employed Professional'], default: 'General Class' },
  series: { type: String, default: 'LAP-REGULAR' },

  // Property Details
  propertyType: { type: String, default: 'Residential Apartment' },
  propertyArea: { type: String, enum: ['Residential', 'Commercial', 'Industrial'], default: 'Residential' },
  propertyAddress: { type: String },
  propertyPinCode: { type: String },
  propertyValue: { type: Number, required: true },
  builtUpArea: { type: Number },
  constructionYear: { type: Number },

  // Loan Details
  loanAmount: { type: Number, required: true },
  interestRate: { type: Number, default: 9.5 },
  tenureMonths: { type: Number, default: 120 },
  emi: { type: Number },
  totalRepayment: { type: Number },
  ltv: { type: Number },
  foir: { type: Number },

  // Income
  monthlyIncome: { type: Number, required: true },
  monthlyObligations: { type: Number, default: 0 },

  // CIBIL & Verification
  cibil: { type: Number, default: 0 },
  cibilStatus: { type: String, enum: ['Pending', 'Fair', 'Good', 'Excellent'], default: 'Pending' },
  otpVerified: { type: Boolean, default: false },
  faceVerified: { type: Boolean, default: false },
  photoUrl: { type: String },
  signatureUrl: { type: String },

  // LAP Stage (0-4)
  stage: { type: Number, default: 0, min: 0, max: 4 },
  disbursed: { type: Boolean, default: false },

  // Stage 2 - Property Appraisal
  appraisedValue: { type: Number },
  valuerName: { type: String },
  valuerRegNo: { type: String },
  valuationMethod: { type: String, default: 'Market Comparison' },
  appraisalDate: { type: Date },

  // Stage 3 - Legal
  titleSearchStatus: { type: String, enum: ['Clear', 'Encumbered', 'In Progress'], default: 'In Progress' },
  encumbranceCert: { type: String, enum: ['Obtained', 'Applied', 'Pending'], default: 'Pending' },
  legalOpinion: { type: String, enum: ['Affirmative', 'Conditional', 'Negative'] },
  technicalValuation: { type: Number },
  stampDuty: { type: Number },
  registrationCharges: { type: Number },
  processingFee: { type: Number },

  // Co-applicants
  coApplicants: [coApplicantSchema],

  // Card Issuance
  cardIssued: { type: Boolean, default: false },
  cardLimit: { type: Number },
  cardNetwork: { type: String, enum: ['VISA', 'MASTERCARD', 'RUPAY'], default: 'VISA' },
  cardSkin: { type: String, default: 'purple' },
  cardMintedAt: { type: Date },

  // Nominee
  nomineeName: { type: String },
  nomineeRelation: { type: String },

  // Payment
  paymentMode: { type: String, default: 'ECS' },
  clearingBank: { type: String },

  // Assigned officer
  assignedOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Field completion tracking
  fieldsFilled: { type: Number, default: 22 },
  fieldsTotal: { type: Number, default: 34 },

}, { timestamps: true });

// Auto-generate LAP App Number
applicantSchema.pre('save', async function (next) {
  if (!this.lapAppNo) {
    const count = await mongoose.model('Applicant').countDocuments();
    this.lapAppNo = `LAP-${String(count + 100).padStart(3, '0')}`;
  }
  // Auto-calc LTV
  if (this.propertyValue && this.loanAmount) {
    this.ltv = parseFloat(((this.loanAmount / this.propertyValue) * 100).toFixed(1));
  }
  // Auto-set CIBIL status
  if (this.cibil >= 750) this.cibilStatus = 'Excellent';
  else if (this.cibil >= 650) this.cibilStatus = 'Good';
  else if (this.cibil > 0) this.cibilStatus = 'Fair';
  else this.cibilStatus = 'Pending';

  next();
});

module.exports = mongoose.model('Applicant', applicantSchema);