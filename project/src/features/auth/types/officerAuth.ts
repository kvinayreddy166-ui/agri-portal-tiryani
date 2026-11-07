export type OfficerDesignation = 'AEO' | 'MAO' | 'ADA' | 'DAO';

export interface OfficerProfile {
  id: string;
  full_name: string;
  designation: OfficerDesignation | string;
  hrms_id?: string;
  qualification?: string;
  district: string;
  mandal: string;
  division?: string;
  phone: string;
  email: string;
  role: 'officer' | 'admin';
  status: 'active' | 'pending' | 'suspended';
  created_at?: string;
  updated_at?: string;
}

export interface OfficerRegistrationData {
  full_name: string;
  designation: string;
  hrms_id?: string;
  qualification?: string;
  district: string;
  mandal: string;
  division?: string;
  phone: string;
  email: string;
  password?: string;
}

export type StatutoryOrderType = 'stop_sale' | 'seizure' | 'revocation' | 'show_cause';
export type StatutoryCommodity = 'fertilizer' | 'pesticide' | 'seed';

export interface OfficerStatutoryOrderDbRecord {
  id?: string;
  officer_id: string;
  order_type: StatutoryOrderType;
  commodity: StatutoryCommodity;
  order_number: string;
  order_date: string;
  firm_name: string;
  mandal?: string;
  district?: string;
  payload_json: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface OfficerInspectionDbRecord {
  id?: string;
  officer_id: string;
  inspection_type: StatutoryCommodity;
  firm_name: string;
  license_number?: string;
  inspection_date: string;
  findings_json: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export type LabStatus = 'DRAFT' | 'DISPATCHED' | 'RECEIVED_LAB' | 'TEST_PASSED' | 'TEST_FAILED';

export interface OfficerSampleDbRecord {
  id?: string;
  officer_id: string;
  commodity: StatutoryCommodity;
  sample_code: string;
  firm_name: string;
  date_of_sampling: string;
  batch_no?: string;
  covering_letter_json: Record<string, unknown>;
  lab_status: LabStatus;
  created_at?: string;
  updated_at?: string;
}
