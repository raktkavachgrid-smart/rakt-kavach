export type UserRole = 'citizen' | 'donor' | 'hospital' | 'blood_bank' | 'laboratory' | 'ambulance' | 'district_admin' | 'state_admin' | 'national_admin' | 'super_admin';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';

export type BloodStatus = 'collected' | 'testing' | 'validated' | 'in_transit' | 'transfused' | 'expired';

export type DonorLevel = 'bronze' | 'silver' | 'gold' | 'platinum' | 'national_hero';

export type TransactionType = 'transfer' | 'credit' | 'debit' | 'family_transfer' | 'qr_transfer';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface BloodUnit {
  id: string;
  bloodGroup: BloodGroup;
  status: BloodStatus;
  collectionDate: Date;
  expiryDate: Date;
  bloodBankId: string;
  donorId?: string;
  hospitalId?: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface Donor {
  id: string;
  userId: string;
  level: DonorLevel;
  totalDonations: number;
  lastDonationDate?: Date;
  eligibleForDonation: boolean;
  impactCount: number;
  certificates: string[];
}

export interface BloodBank {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  inventory: {
    [key in BloodGroup]: number;
  };
  capacity: number;
  address: string;
  phone: string;
  contactPerson: string;
}

export interface Hospital {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  address: string;
  phone: string;
  emergencyContact: string;
  bedsCount: number;
}

export interface SOSRequest {
  id: string;
  patientId: string;
  hospitalId: string;
  bloodRequired: {
    [key in BloodGroup]?: number;
  };
  urgencyLevel: 'critical' | 'urgent' | 'normal';
  status: 'active' | 'fulfilled' | 'cancelled' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface BloodWalletTransaction {
  id: string;
  transactionId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  bloodGroup?: BloodGroup;
  fromUserId?: string;
  toUserId?: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
}

export interface DashboardMetrics {
  totalBloodUnits: number;
  activeDonors: number;
  connectedHospitals: number;
  connectedBloodBanks: number;
  activeSOSCases: number;
  stateWiseInventory: {
    [state: string]: {
      [bloodGroup in BloodGroup]: number;
    };
  };
}

export interface AnalyticsData {
  shortagesPrediction: {
    bloodGroup: BloodGroup;
    predictedDate: Date;
    severity: 'low' | 'medium' | 'high';
  }[];
  demandTrends: {
    date: Date;
    bloodGroup: BloodGroup;
    demand: number;
  }[];
  emergencyDensity: {
    state: string;
    caseCount: number;
    responseTime: number;
  }[];
}

export interface AuthSession {
  userId: string;
  token: string;
  role: UserRole;
  expiresAt: Date;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}
