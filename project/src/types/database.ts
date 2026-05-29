export interface Dealer {
  id: string;
  dealer_name: string;
  ifms_id: string;
  phone_number: string;
  license_number: string;
  issue_date: string;
  expiry_date: string;
  location: string;
  dealer_category?: 'fertilizer' | 'seed' | 'pesticide';
  created_at: string;
  updated_at: string;
}

export interface FertilizerStock {
  id: string;
  fertilizer_type: string;
  quantity_available: number;
  unit: string;
  last_updated: string;
  created_at: string;
}

export interface DealerStockAllocation {
  id: string;
  dealer_id: string;
  fertilizer_type: string;
  quantity_mts: number;
  last_updated: string;
  created_at: string;
  dealer_name?: string;
  dealer_location?: string;
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
  description: string;
  file_url: string | null;
  file_type: string;
  category: string;
  created_at: string;
}

export interface ExcelUpload {
  id: string;
  file_name: string;
  file_url: string;
  upload_type: string;
  created_at: string;
  created_by: string;
}

export interface GosCircular {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  file_type: string;
  issued_date: string | null;
  created_at: string;
  created_by: string;
}

export interface QualityControlSample {
  id: string;
  category: string;
  financial_year: string;
  dealer_name: string;
  license_number: string;
  phone_number: string;
  location: string;
  sample_date: string;
  form_url: string | null;
  remarks: string;
  created_at: string;
  created_by: string;
}

export interface QualityControlTarget {
  id: string;
  category: string;
  financial_year: string;
  target_count: number;
  created_at: string;
  updated_at: string;
}

export interface FarmMechanizationDocument {
  id: string;
  document_type: 'applications_received' | 'proceedings_generated';
  financial_year: string;
  title: string;
  file_name: string;
  file_url: string;
  created_at: string;
  created_by: string;
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
