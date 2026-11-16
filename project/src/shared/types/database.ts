export interface Dealer {
  id: string;
  dealer_name: string;
  ifms_id: string | null;
  phone_number: string;
  portal_email?: string | null;
  license_number: string;
  issue_date: string;
  expiry_date: string;
  location: string;
  district?: string | null;
  mandal?: string | null;
  dealer_category?: string;
  created_by?: string | null;
  created_by_name?: string | null;
  last_login_at?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface FertilizerStock {
  id: string;
  fertilizer_type: string;
  quantity_available: number;
  unit: string;
  last_updated: string;
  created_at: string;
}

export interface StockInventoryLine {
  id: string;
  dealer_id: string;
  category: 'fertilizer' | 'seed' | 'pesticide';
  serial_no: number;
  product_type: string;
  opening_balance: number;
  receipts: number;
  total: number;
  sales: number;
  closing_balance: number;
  report_month: string;
  created_at: string;
  updated_at: string;
  submitted_by: string;
}

export interface DealerStockAllocation {
  id: string;
  dealer_id: string;
  fertilizer_type: string;
  quantity_mts: number | null;
  wholesaler_name?: string | null;
  invoice_number?: string | null;
  invoice_date?: string | null;
  quantity_unit?: string | null;
  quantity_bags?: number | null;
  last_updated: string | null;
  created_at: string | null;
  dealer_name?: string | null;
  dealer_location?: string | null;
}

export interface Crop {
  id: string;
  crop_name: string;
  acreage: number;
  description: string;
  image_url: string;
  created_at: string;
}

export interface CropData {
  id: string;
  crop_id: string;
  title: string;
  description: string;
  file_url: string | null;
  file_type: string;
  created_at: string;
  created_by: string;
}

export interface Scheme {
  id: string;
  scheme_name: string;
  description: string;
  beneficiary_details: string;
  eligibility: string;
  benefits: string;
  created_at: string;
  updated_at: string;
}

export interface SchemeBeneficiary {
  id: string;
  scheme_id: string;
  financial_year: string;
  beneficiaries_count: number;
  notes: string;
  created_at: string;
  created_by: string;
}

export interface FormDownload {
  id: string;
  title: string;
  label?: string | null;
  description: string | null;
  file_url: string | null;
  file_type: string | null;
  category: string | null;
  created_at: string | null;
}

export interface ExcelUpload {
  id: string;
  file_name: string;
  file_url: string;
  upload_type: string | null;
  created_at: string | null;
  created_by: string | null;
}

export interface GosCircular {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  file_type: string;
  doc_type?: 'go' | 'circular' | string;
  issued_date: string | null;
  created_at: string;
  created_by: string;
}

export interface FarmMechanizationDocument {
  id: string;
  document_type: string;
  financial_year: string;
  title: string;
  file_name: string;
  file_url: string;
  created_at: string | null;
  created_by: string | null;
}

export interface Settings {
  id: string;
  setting_key: string;
  setting_value: string;
  updated_at: string;
}

export interface SiteContent {
  id: string;
  section_name: string;
  content: MandalOverview;
  updated_at: string;
}

export interface MandalOverview {
  total_gram_panchayats: number;
  total_revenue_villages: number;
  geographical_area: number;
  total_farmers: number;
  cultivable_area: number;
  area_unit: string;
  normal_rainfall: number;
  rainfall_unit: string;
  soil_types: string[];
}
