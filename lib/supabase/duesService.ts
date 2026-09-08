import { supabase } from './config';
import { errorMessage } from './errors';
import { CreateDuesRequestDto, DuesPaymentStatus, DuesRequest, VerifiedReceipt } from '@/types/dues';

const TABLE = 'dues_requests';

interface DuesRow {
  id: string;
  reference: string;
  full_name: string;
  email: string;
  phone: string;
  matric_number: string;
  level: DuesRequest['level'];
  status: DuesRequest['status'];
  amount: number;
  fee_amount: number;
  total_amount: number;
  payment_status: DuesPaymentStatus;
  bachs_collection_id: string | null;
  paid_at: string | null;
  created_at: string;
}

function mapRow(row: DuesRow): DuesRequest {
  return {
    id: row.id,
    reference: row.reference,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    matricNumber: row.matric_number,
    level: row.level,
    status: row.status,
    amount: row.amount,
    feeAmount: row.fee_amount,
    totalAmount: row.total_amount,
    paymentStatus: row.payment_status,
    bachsCollectionId: row.bachs_collection_id || undefined,
    paidAt: row.paid_at ? new Date(row.paid_at) : undefined,
    createdAt: new Date(row.created_at),
  };
}

export const submitDuesRequest = async (data: CreateDuesRequestDto, userId: string): Promise<DuesRequest> => {
  const { data: row, error } = await supabase
    .from(TABLE)
    .insert({
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      matric_number: data.matricNumber,
      level: data.level,
      status: data.status,
      amount: data.amount,
      fee_amount: data.feeAmount,
      total_amount: data.amount + data.feeAmount,
      created_by: userId,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error submitting dues request:', errorMessage(error));
    throw error;
  }
  return mapRow(row as DuesRow);
};

// Matches by reference first if given (most specific), otherwise by matric
// number. RLS already scopes results to the caller's own submissions unless
// they're super_admin, so this never needs to filter by user on top of that.
export const findDuesRequests = async (query: { matric?: string; reference?: string }): Promise<DuesRequest[]> => {
  let q = supabase.from(TABLE).select('*').order('created_at', { ascending: false });
  if (query.reference?.trim()) {
    q = q.eq('reference', query.reference.trim().toUpperCase());
  } else if (query.matric?.trim()) {
    q = q.eq('matric_number', query.matric.trim());
  }

  const { data, error } = await q;
  if (error) {
    console.error('Error finding dues requests:', errorMessage(error));
    throw error;
  }
  return (data as DuesRow[]).map(mapRow);
};

// Single search box: matches either a matric number or a reference, so the
// caller doesn't need to know or care which one they're typing.
export const searchDuesRequests = async (query: string): Promise<DuesRequest[]> => {
  const value = query.trim();
  if (!value) return [];

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .or(`matric_number.eq.${value},reference.eq.${value.toUpperCase()}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching dues requests:', errorMessage(error));
    throw error;
  }
  return (data as DuesRow[]).map(mapRow);
};

export const getAllDuesRequests = async (): Promise<DuesRequest[]> => {
  const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error getting all dues requests:', errorMessage(error));
    throw error;
  }
  return (data as DuesRow[]).map(mapRow);
};

export const updateDuesPaymentStatus = async (id: string, paymentStatus: DuesPaymentStatus): Promise<void> => {
  const { error } = await supabase.from(TABLE).update({ payment_status: paymentStatus }).eq('id', id);
  if (error) {
    console.error('Error updating payment status:', errorMessage(error));
    throw error;
  }
};

// Public, unauthenticated lookup for the /verify/<reference> page — backed
// by a security-definer function that only ever returns non-sensitive
// fields, and only for a paid record. Returns null for anything else
// (wrong reference, not yet paid) without distinguishing which.
export const verifyReceipt = async (reference: string): Promise<VerifiedReceipt | null> => {
  const { data, error } = await supabase.rpc('verify_receipt', { p_reference: reference.trim().toUpperCase() });
  if (error) {
    console.error('Error verifying receipt:', errorMessage(error));
    throw error;
  }
  const row = data?.[0];
  if (!row) return null;
  return {
    reference: row.reference,
    fullName: row.full_name,
    level: row.level,
    status: row.status,
    amount: row.amount,
    feeAmount: row.fee_amount,
    totalAmount: row.total_amount,
    paidAt: new Date(row.paid_at),
  };
};
