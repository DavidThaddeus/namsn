export type StudentStatus = 'FRESHERS' | 'STAYLITES';
// 'DE' = Direct Entry freshers: tracked as their own level but charged the
// same as 100L FRESHERS.
export type DuesLevel = '100' | 'DE' | '200' | '300' | '400';

export const formatDuesLevel = (level: DuesLevel): string =>
  level === 'DE' ? 'DE (Direct Entry)' : level;
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
