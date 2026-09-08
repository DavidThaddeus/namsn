export type StudentStatus = 'FRESHERS' | 'STAYLITES';
export type DuesLevel = '100' | '200' | '300' | '400';
export type DuesPaymentStatus = 'pending' | 'paid';

export interface DuesRequest {
  id: string;
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  matricNumber: string;
  level: DuesLevel;
  status: StudentStatus;
  amount: number;
  feeAmount: number;
  totalAmount: number;
  paymentStatus: DuesPaymentStatus;
  bachsCollectionId?: string;
  paidAt?: Date;
  createdAt: Date;
}

export interface CreateDuesRequestDto {
  fullName: string;
  email: string;
  phone: string;
  matricNumber: string;
  level: DuesLevel;
  status: StudentStatus;
  amount: number;
  feeAmount: number;
}

// The minimal, public-safe shape returned by the verify_receipt() function —
// no email/phone, and only ever populated for a paid record.
export interface VerifiedReceipt {
  reference: string;
  fullName: string;
  level: DuesLevel;
  status: StudentStatus;
  amount: number;
  feeAmount: number;
  totalAmount: number;
  paidAt: Date;
}
