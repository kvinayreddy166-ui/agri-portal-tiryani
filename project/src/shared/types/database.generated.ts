export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      cibrc_recommendations: {
        Row: {
          active_ingredient: string | null
          ai_dose: string | null
          category: string
          created_at: string
          crop: string | null
          dose_per_acre: string | null
          formulation: string | null
          formulation_per_acre: string | null
          id: string
          original_target_group: string | null
          product: string | null
          source_document: string | null
          source_hash: string
          source_page: number | null
          target: string | null
          target_type: string | null
          updated_at: string
          waiting_period: string | null
          water_per_acre: string | null
          water_per_ha: string | null
        }
        Insert: {
          active_ingredient?: string | null
          ai_dose?: string | null
          category: string
          created_at?: string
          crop?: string | null
          dose_per_acre?: string | null
          formulation?: string | null
          formulation_per_acre?: string | null
          id?: string
          original_target_group?: string | null
          product?: string | null
          source_document?: string | null
          source_hash: string
          source_page?: number | null
          target?: string | null
          target_type?: string | null
          updated_at?: string
          waiting_period?: string | null
          water_per_acre?: string | null
          water_per_ha?: string | null
        }
        Update: {
          active_ingredient?: string | null
          ai_dose?: string | null
          category?: string
          created_at?: string
          crop?: string | null
          dose_per_acre?: string | null
          formulation?: string | null
          formulation_per_acre?: string | null
          id?: string
          original_target_group?: string | null
          product?: string | null
          source_document?: string | null
          source_hash?: string
          source_page?: number | null
          target?: string | null
          target_type?: string | null
          updated_at?: string
          waiting_period?: string | null
          water_per_acre?: string | null
          water_per_ha?: string | null
        }
        Relationships: []
      }
      crop_advisories: {
        Row: {
          advisory_en: string
          advisory_te: string | null
          category: string
          created_at: string | null
          crop_id: string
          id: string
          keywords: string[] | null
          priority: string | null
          updated_at: string | null
        }
        Insert: {
          advisory_en: string
          advisory_te?: string | null
          category: string
          created_at?: string | null
          crop_id: string
          id?: string
          keywords?: string[] | null
          priority?: string | null
          updated_at?: string | null
        }
        Update: {
          advisory_en?: string
          advisory_te?: string | null
          category?: string
          created_at?: string | null
          crop_id?: string
          id?: string
          keywords?: string[] | null
          priority?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_advisories_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_data: {
        Row: {
          created_at: string | null
          created_by: string | null
          crop_id: string | null
          description: string | null
          file_type: string | null
          file_url: string | null
          id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          crop_id?: string | null
          description?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          crop_id?: string | null
          description?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "crop_data_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_deficiencies: {
        Row: {
          correction: string | null
          created_at: string | null
          crop_id: string
          deficiency_name: string
          id: string
          image_url: string | null
          nutrient: string | null
          symptoms: string | null
          updated_at: string | null
        }
        Insert: {
          correction?: string | null
          created_at?: string | null
          crop_id: string
          deficiency_name: string
          id?: string
          image_url?: string | null
          nutrient?: string | null
          symptoms?: string | null
          updated_at?: string | null
        }
        Update: {
          correction?: string | null
          created_at?: string | null
          crop_id?: string
          deficiency_name?: string
          id?: string
          image_url?: string | null
          nutrient?: string | null
          symptoms?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_deficiencies_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_diseases: {
        Row: {
          causal_organism: string | null
          created_at: string | null
          crop_id: string
          disease_name: string
          fungicide: string | null
          id: string
          image_source_url: string | null
          image_url: string | null
          management: string | null
          symptoms: string | null
          updated_at: string | null
        }
        Insert: {
          causal_organism?: string | null
          created_at?: string | null
          crop_id: string
          disease_name: string
          fungicide?: string | null
          id?: string
          image_source_url?: string | null
          image_url?: string | null
          management?: string | null
          symptoms?: string | null
          updated_at?: string | null
        }
        Update: {
          causal_organism?: string | null
          created_at?: string | null
          crop_id?: string
          disease_name?: string
          fungicide?: string | null
          id?: string
          image_source_url?: string | null
          image_url?: string | null
          management?: string | null
          symptoms?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_diseases_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_faqs: {
        Row: {
          answer: string
          answer_te: string | null
          category: string | null
          created_at: string | null
          crop_id: string
          id: string
          keywords: string[] | null
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          answer_te?: string | null
          category?: string | null
          created_at?: string | null
          crop_id: string
          id?: string
          keywords?: string[] | null
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          answer_te?: string | null
          category?: string | null
          created_at?: string | null
          crop_id?: string
          id?: string
          keywords?: string[] | null
          question?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_faqs_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_fertilizer_recommendations: {
        Row: {
          area_unit: string | null
          created_at: string | null
          crop: string | null
          crop_name: string
          id: string
          is_active: boolean
          k: number
          n: number
          nutrients: Json
          p: number
          season: string | null
          split_plan: Json | null
          updated_at: string | null
          variety: string | null
          zone: string | null
        }
        Insert: {
          area_unit?: string | null
          created_at?: string | null
          crop?: string | null
          crop_name: string
          id?: string
          is_active?: boolean
          k?: number
          n?: number
          nutrients?: Json
          p?: number
          season?: string | null
          split_plan?: Json | null
          updated_at?: string | null
          variety?: string | null
          zone?: string | null
        }
        Update: {
          area_unit?: string | null
          created_at?: string | null
          crop?: string | null
          crop_name?: string
          id?: string
          is_active?: boolean
          k?: number
          n?: number
          nutrients?: Json
          p?: number
          season?: string | null
          split_plan?: Json | null
          updated_at?: string | null
          variety?: string | null
          zone?: string | null
        }
        Relationships: []
      }
      crop_fertilizers: {
        Row: {
          created_at: string | null
          crop_id: string
          description_te: string | null
          fertilizer: string
          id: string
          method: string | null
          quantity: string | null
          stage: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          crop_id: string
          description_te?: string | null
          fertilizer: string
          id?: string
          method?: string | null
          quantity?: string | null
          stage: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          crop_id?: string
          description_te?: string | null
          fertilizer?: string
          id?: string
          method?: string | null
          quantity?: string | null
          stage?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_fertilizers_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          crop_id: string | null
          entity_name: string
          entity_type: string
          id: string
          image_url: string
          source_name: string | null
          source_url: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          crop_id?: string | null
          entity_name: string
          entity_type: string
          id?: string
          image_url: string
          source_name?: string | null
          source_url?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          crop_id?: string | null
          entity_name?: string
          entity_type?: string
          id?: string
          image_url?: string
          source_name?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_images_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_intelligence: {
        Row: {
          content: Json
          created_at: string | null
          crop_image_url: string | null
          id: string
          name_en: string
          name_te: string
          risks: Json
          scientific_name: string | null
          slug: string
          source_pdf_name: string | null
          source_pdf_url: string | null
          updated_at: string | null
        }
        Insert: {
          content?: Json
          created_at?: string | null
          crop_image_url?: string | null
          id?: string
          name_en: string
          name_te: string
          risks?: Json
          scientific_name?: string | null
          slug: string
          source_pdf_name?: string | null
          source_pdf_url?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          crop_image_url?: string | null
          id?: string
          name_en?: string
          name_te?: string
          risks?: Json
          scientific_name?: string | null
          slug?: string
          source_pdf_name?: string | null
          source_pdf_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      crop_irrigation: {
        Row: {
          created_at: string | null
          crop_id: string
          id: string
          recommendation_en: string
          recommendation_te: string | null
          stage: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          crop_id: string
          id?: string
          recommendation_en: string
          recommendation_te?: string | null
          stage: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          crop_id?: string
          id?: string
          recommendation_en?: string
          recommendation_te?: string | null
          stage?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_irrigation_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_pests: {
        Row: {
          chemical_control: string | null
          created_at: string | null
          crop_id: string
          id: string
          image_source_url: string | null
          image_url: string | null
          management: string | null
          pest_name: string
          scientific_name: string | null
          symptoms: string | null
          updated_at: string | null
        }
        Insert: {
          chemical_control?: string | null
          created_at?: string | null
          crop_id: string
          id?: string
          image_source_url?: string | null
          image_url?: string | null
          management?: string | null
          pest_name: string
          scientific_name?: string | null
          symptoms?: string | null
          updated_at?: string | null
        }
        Update: {
          chemical_control?: string | null
          created_at?: string | null
          crop_id?: string
          id?: string
          image_source_url?: string | null
          image_url?: string | null
          management?: string | null
          pest_name?: string
          scientific_name?: string | null
          symptoms?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_pests_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_production: {
        Row: {
          category: string
          created_at: string | null
          crop_id: string
          description_en: string
          description_te: string | null
          id: string
          season: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          crop_id: string
          description_en: string
          description_te?: string | null
          id?: string
          season?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          crop_id?: string
          description_en?: string
          description_te?: string | null
          id?: string
          season?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_production_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_varieties: {
        Row: {
          created_at: string | null
          crop_id: string
          duration: string | null
          expected_yield: string | null
          id: string
          image_url: string | null
          special_features: string | null
          updated_at: string | null
          variety: string
        }
        Insert: {
          created_at?: string | null
          crop_id: string
          duration?: string | null
          expected_yield?: string | null
          id?: string
          image_url?: string | null
          special_features?: string | null
          updated_at?: string | null
          variety: string
        }
        Update: {
          created_at?: string | null
          crop_id?: string
          duration?: string | null
          expected_yield?: string | null
          id?: string
          image_url?: string | null
          special_features?: string | null
          updated_at?: string | null
          variety?: string
        }
        Relationships: [
          {
            foreignKeyName: "crop_varieties_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_weeds: {
        Row: {
          control_measure: string | null
          created_at: string | null
          crop_id: string
          dose: string | null
          herbicide: string | null
          id: string
          image_url: string | null
          scientific_name: string | null
          updated_at: string | null
          weed_name: string
        }
        Insert: {
          control_measure?: string | null
          created_at?: string | null
          crop_id: string
          dose?: string | null
          herbicide?: string | null
          id?: string
          image_url?: string | null
          scientific_name?: string | null
          updated_at?: string | null
          weed_name: string
        }
        Update: {
          control_measure?: string | null
          created_at?: string | null
          crop_id?: string
          dose?: string | null
          herbicide?: string | null
          id?: string
          image_url?: string | null
          scientific_name?: string | null
          updated_at?: string | null
          weed_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "crop_weeds_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
      }
      crops: {
        Row: {
          acreage: number | null
          created_at: string | null
          crop_name: string
          description: string | null
          id: string
          image_url: string | null
          name_en: string | null
          name_te: string | null
          profile: Json | null
          scientific_name: string | null
          slug: string | null
          source_pdf_name: string | null
          source_pdf_url: string | null
          updated_at: string | null
        }
        Insert: {
          acreage?: number | null
          created_at?: string | null
          crop_name: string
          description?: string | null
          id?: string
          image_url?: string | null
          name_en?: string | null
          name_te?: string | null
          profile?: Json | null
          scientific_name?: string | null
          slug?: string | null
          source_pdf_name?: string | null
          source_pdf_url?: string | null
          updated_at?: string | null
        }
        Update: {
          acreage?: number | null
          created_at?: string | null
          crop_name?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name_en?: string | null
          name_te?: string | null
          profile?: Json | null
          scientific_name?: string | null
          slug?: string | null
          source_pdf_name?: string | null
          source_pdf_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dealer_stock_allocation: {
        Row: {
          created_at: string | null
          dealer_id: string
          fertilizer_type: string
          id: string
          invoice_date: string | null
          invoice_number: string | null
          last_updated: string | null
          quantity_bags: number | null
          quantity_mts: number | null
          quantity_unit: string | null
          wholesaler_name: string | null
        }
        Insert: {
          created_at?: string | null
          dealer_id: string
          fertilizer_type: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          last_updated?: string | null
          quantity_bags?: number | null
          quantity_mts?: number | null
          quantity_unit?: string | null
          wholesaler_name?: string | null
        }
        Update: {
          created_at?: string | null
          dealer_id?: string
          fertilizer_type?: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          last_updated?: string | null
          quantity_bags?: number | null
          quantity_mts?: number | null
          quantity_unit?: string | null
          wholesaler_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dealer_stock_allocation_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
      dealers: {
        Row: {
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          dealer_category: string
          dealer_name: string
          district: string | null
          expiry_date: string
          id: string
          ifms_id: string | null
          issue_date: string
          last_login_at: string | null
          license_number: string
          location: string
          mandal: string | null
          phone_number: string
          portal_email: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          dealer_category?: string
          dealer_name: string
          district?: string | null
          expiry_date: string
          id?: string
          ifms_id?: string | null
          issue_date: string
          last_login_at?: string | null
          license_number: string
          location: string
          mandal?: string | null
          phone_number: string
          portal_email?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          dealer_category?: string
          dealer_name?: string
          district?: string | null
          expiry_date?: string
          id?: string
          ifms_id?: string | null
          issue_date?: string
          last_login_at?: string | null
          license_number?: string
          location?: string
          mandal?: string | null
          phone_number?: string
          portal_email?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      excel_uploads: {
        Row: {
          created_at: string | null
          created_by: string | null
          file_name: string
          file_url: string
          id: string
          upload_type: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          file_name: string
          file_url: string
          id?: string
          upload_type?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          file_name?: string
          file_url?: string
          id?: string
          upload_type?: string | null
        }
        Relationships: []
      }
      farm_mechanization_documents: {
        Row: {
          created_at: string | null
          created_by: string | null
          document_type: string
          file_name: string
          file_url: string
          financial_year: string
          id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          document_type: string
          file_name: string
          file_url: string
          financial_year: string
          id?: string
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          document_type?: string
          file_name?: string
          file_url?: string
          financial_year?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      farmer_database: {
        Row: {
          aadhaar_last4: string
          aadhaar_no: string
          created_at: string
          created_by: string | null
          crop: string
          extent: number
          farmer_name_english: string
          farmer_name_telugu: string
          father_or_husband_name_english: string
          father_or_husband_name_telugu: string
          id: string
          identity_key: string
          phone_number: string
          ppb_no: string
          remarks: string
          row_hash: string
          s_no: number | null
          search_text: string
          survey_no: string
          updated_at: string
          updated_by: string | null
          village_english: string
          village_telugu: string
        }
        Insert: {
          aadhaar_last4?: string
          aadhaar_no?: string
          created_at?: string
          created_by?: string | null
          crop?: string
          extent?: number
          farmer_name_english?: string
          farmer_name_telugu?: string
          father_or_husband_name_english?: string
          father_or_husband_name_telugu?: string
          id?: string
          identity_key?: string
          phone_number?: string
          ppb_no?: string
          remarks?: string
          row_hash?: string
          s_no?: number | null
          search_text?: string
          survey_no?: string
          updated_at?: string
          updated_by?: string | null
          village_english?: string
          village_telugu?: string
        }
        Update: {
          aadhaar_last4?: string
          aadhaar_no?: string
          created_at?: string
          created_by?: string | null
          crop?: string
          extent?: number
          farmer_name_english?: string
          farmer_name_telugu?: string
          father_or_husband_name_english?: string
          father_or_husband_name_telugu?: string
          id?: string
          identity_key?: string
          phone_number?: string
          ppb_no?: string
          remarks?: string
          row_hash?: string
          s_no?: number | null
          search_text?: string
          survey_no?: string
          updated_at?: string
          updated_by?: string | null
          village_english?: string
          village_telugu?: string
        }
        Relationships: []
      }
      farmer_grievances: {
        Row: {
          created_at: string
          email_to: string
          farmer_name: string
          id: string
          issue_type: string
          message: string
          phone: string | null
          status: string
          village: string
        }
        Insert: {
          created_at?: string
          email_to?: string
          farmer_name: string
          id?: string
          issue_type: string
          message: string
          phone?: string | null
          status?: string
          village: string
        }
        Update: {
          created_at?: string
          email_to?: string
          farmer_name?: string
          id?: string
          issue_type?: string
          message?: string
          phone?: string | null
          status?: string
          village?: string
        }
        Relationships: []
      }
      fertilizer_calculation_records: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          input: Json
          output: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          input?: Json
          output?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          input?: Json
          output?: Json
          updated_at?: string
        }
        Relationships: []
      }
      fertilizer_grades: {
        Row: {
          bag_kg: number
          composition: Json
          created_at: string | null
          id: string
          is_active: boolean
          k: number
          n: number
          name: string
          p: number
          s: number
          updated_at: string | null
        }
        Insert: {
          bag_kg?: number
          composition?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean
          k?: number
          n?: number
          name: string
          p?: number
          s?: number
          updated_at?: string | null
        }
        Update: {
          bag_kg?: number
          composition?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean
          k?: number
          n?: number
          name?: string
          p?: number
          s?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      fertilizer_stock: {
        Row: {
          created_at: string | null
          fertilizer_type: string
          id: string
          last_updated: string | null
          quantity_available: number | null
          unit: string | null
        }
        Insert: {
          created_at?: string | null
          fertilizer_type: string
          id?: string
          last_updated?: string | null
          quantity_available?: number | null
          unit?: string | null
        }
        Update: {
          created_at?: string | null
          fertilizer_type?: string
          id?: string
          last_updated?: string | null
          quantity_available?: number | null
          unit?: string | null
        }
        Relationships: []
      }
      forms_downloads: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          file_type: string | null
          file_url: string | null
          id: string
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      gos_circulars: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          doc_type: string
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          issued_date: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          doc_type?: string
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          issued_date?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          doc_type?: string
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          issued_date?: string | null
          title?: string
        }
        Relationships: []
      }
      knowledge_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_chunks: {
        Row: {
          chunk_index: number
          chunk_text: string
          created_at: string
          document_id: string
          embedding: string | null
          fts: unknown
          id: string
          metadata: Json | null
          page_end_number: number | null
          page_number: number | null
          section_heading: string | null
          section_path: string | null
          token_count: number | null
        }
        Insert: {
          chunk_index: number
          chunk_text: string
          created_at?: string
          document_id: string
          embedding?: string | null
          fts?: unknown
          id?: string
          metadata?: Json | null
          page_end_number?: number | null
          page_number?: number | null
          section_heading?: string | null
          section_path?: string | null
          token_count?: number | null
        }
        Update: {
          chunk_index?: number
          chunk_text?: string
          created_at?: string
          document_id?: string
          embedding?: string | null
          fts?: unknown
          id?: string
          metadata?: Json | null
          page_end_number?: number | null
          page_number?: number | null
          section_heading?: string | null
          section_path?: string | null
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_document_categories: {
        Row: {
          category_id: string
          created_at: string
          document_id: string
          id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          document_id: string
          id?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          document_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_document_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "knowledge_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_document_categories_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_documents: {
        Row: {
          authority: string | null
          chunk_count: number | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          department: string | null
          description: string | null
          document_date: string | null
          document_number: string | null
          document_type: string
          effective_date: string | null
          file_hash: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_active: boolean | null
          is_superseded: boolean | null
          keywords: string[] | null
          language: string | null
          mime_type: string | null
          page_count: number | null
          reference_number: string | null
          state: string | null
          status: string
          superseded_by: string | null
          title: string
          updated_at: string
          version: string | null
        }
        Insert: {
          authority?: string | null
          chunk_count?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          department?: string | null
          description?: string | null
          document_date?: string | null
          document_number?: string | null
          document_type: string
          effective_date?: string | null
          file_hash?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          is_superseded?: boolean | null
          keywords?: string[] | null
          language?: string | null
          mime_type?: string | null
          page_count?: number | null
          reference_number?: string | null
          state?: string | null
          status?: string
          superseded_by?: string | null
          title: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          authority?: string | null
          chunk_count?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          department?: string | null
          description?: string | null
          document_date?: string | null
          document_number?: string | null
          document_type?: string
          effective_date?: string | null
          file_hash?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          is_superseded?: boolean | null
          keywords?: string[] | null
          language?: string | null
          mime_type?: string | null
          page_count?: number | null
          reference_number?: string | null
          state?: string | null
          status?: string
          superseded_by?: string | null
          title?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_documents_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_feedback: {
        Row: {
          comments: string | null
          created_at: string
          feedback: string
          id: string
          query_id: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          feedback: string
          id?: string
          query_id: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          feedback?: string
          id?: string
          query_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_feedback_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "knowledge_queries"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_processing_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step: string | null
          document_id: string
          error_message: string | null
          id: string
          processed_chunks: number | null
          progress: number | null
          started_at: string | null
          status: string
          total_chunks: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step?: string | null
          document_id: string
          error_message?: string | null
          id?: string
          processed_chunks?: number | null
          progress?: number | null
          started_at?: string | null
          status?: string
          total_chunks?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step?: string | null
          document_id?: string
          error_message?: string | null
          id?: string
          processed_chunks?: number | null
          progress?: number | null
          started_at?: string | null
          status?: string
          total_chunks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_processing_jobs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_queries: {
        Row: {
          created_at: string
          id: string
          language: string | null
          query: string
          response_time_ms: number | null
          retrieval_quality: string | null
          retrieved_chunk_ids: string[] | null
          retrieved_document_ids: string[] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string | null
          query: string
          response_time_ms?: number | null
          retrieval_quality?: string | null
          retrieved_chunk_ids?: string[] | null
          retrieved_document_ids?: string[] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          language?: string | null
          query?: string
          response_time_ms?: number | null
          retrieval_quality?: string | null
          retrieved_chunk_ids?: string[] | null
          retrieved_document_ids?: string[] | null
          user_id?: string | null
        }
        Relationships: []
      }
      knowledge_suggested_questions: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_active: boolean | null
          question: string
          sort_order: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          question: string
          sort_order?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          question?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      officer_cases: {
        Row: {
          case_number: string
          commodity: string
          created_at: string
          dealer_name: string
          id: string
          license_number: string | null
          linked_record_ids: Json
          notes: string | null
          officer_id: string
          opened_date: string
          priority: string
          stage: string
          target_close_date: string | null
          updated_at: string
        }
        Insert: {
          case_number: string
          commodity: string
          created_at?: string
          dealer_name: string
          id?: string
          license_number?: string | null
          linked_record_ids?: Json
          notes?: string | null
          officer_id: string
          opened_date: string
          priority?: string
          stage?: string
          target_close_date?: string | null
          updated_at?: string
        }
        Update: {
          case_number?: string
          commodity?: string
          created_at?: string
          dealer_name?: string
          id?: string
          license_number?: string | null
          linked_record_ids?: Json
          notes?: string | null
          officer_id?: string
          opened_date?: string
          priority?: string
          stage?: string
          target_close_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      officer_contacts: {
        Row: {
          active: boolean | null
          cluster: string | null
          created_at: string | null
          district: string
          division: string | null
          email: string | null
          id: string
          mandal: string | null
          name: string | null
          officer_type: string
          phone: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          cluster?: string | null
          created_at?: string | null
          district: string
          division?: string | null
          email?: string | null
          id?: string
          mandal?: string | null
          name?: string | null
          officer_type: string
          phone: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          cluster?: string | null
          created_at?: string | null
          district?: string
          division?: string | null
          email?: string | null
          id?: string
          mandal?: string | null
          name?: string | null
          officer_type?: string
          phone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      officer_document_archive: {
        Row: {
          compression_method: string | null
          compression_status: string
          content_hash: string
          created_at: string
          document_category: string
          document_date: string
          document_name: string
          document_number: string | null
          file_format: string
          id: string
          metadata_json: Json
          mime_type: string
          object_key: string
          original_filename: string | null
          original_sha256: string | null
          original_size: number
          original_size_bytes: number | null
          parent_document_id: string | null
          restoration_verified: boolean | null
          source_module: string
          stored_sha256: string | null
          stored_size: number
          stored_size_bytes: number | null
          updated_at: string
          upload_status: string
          user_id: string
          version_number: number
        }
        Insert: {
          compression_method?: string | null
          compression_status?: string
          content_hash: string
          created_at?: string
          document_category: string
          document_date?: string
          document_name: string
          document_number?: string | null
          file_format: string
          id?: string
          metadata_json?: Json
          mime_type: string
          object_key: string
          original_filename?: string | null
          original_sha256?: string | null
          original_size: number
          original_size_bytes?: number | null
          parent_document_id?: string | null
          restoration_verified?: boolean | null
          source_module: string
          stored_sha256?: string | null
          stored_size: number
          stored_size_bytes?: number | null
          updated_at?: string
          upload_status?: string
          user_id: string
          version_number?: number
        }
        Update: {
          compression_method?: string | null
          compression_status?: string
          content_hash?: string
          created_at?: string
          document_category?: string
          document_date?: string
          document_name?: string
          document_number?: string | null
          file_format?: string
          id?: string
          metadata_json?: Json
          mime_type?: string
          object_key?: string
          original_filename?: string | null
          original_sha256?: string | null
          original_size?: number
          original_size_bytes?: number | null
          parent_document_id?: string | null
          restoration_verified?: boolean | null
          source_module?: string
          stored_sha256?: string | null
          stored_size?: number
          stored_size_bytes?: number | null
          updated_at?: string
          upload_status?: string
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "officer_document_archive_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "officer_document_archive"
            referencedColumns: ["id"]
          },
        ]
      }
      officer_email_otps: {
        Row: {
          attempts: number | null
          consumed: boolean | null
          created_at: string
          email: string
          expires_at: string
          id: string
          otp_code: string
          payload: Json | null
          purpose: string
        }
        Insert: {
          attempts?: number | null
          consumed?: boolean | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          otp_code: string
          payload?: Json | null
          purpose?: string
        }
        Update: {
          attempts?: number | null
          consumed?: boolean | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          otp_code?: string
          payload?: Json | null
          purpose?: string
        }
        Relationships: []
      }
      officer_inspections: {
        Row: {
          created_at: string
          findings_json: Json
          firm_name: string
          id: string
          inspection_date: string
          inspection_type: string
          license_number: string | null
          officer_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          findings_json?: Json
          firm_name: string
          id?: string
          inspection_date: string
          inspection_type: string
          license_number?: string | null
          officer_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          findings_json?: Json
          firm_name?: string
          id?: string
          inspection_date?: string
          inspection_type?: string
          license_number?: string | null
          officer_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      officer_profiles: {
        Row: {
          created_at: string
          designation: string
          district: string
          division: string | null
          email: string
          full_name: string
          hrms_id: string | null
          id: string
          mandal: string
          phone: string
          qualification: string | null
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          designation: string
          district: string
          division?: string | null
          email: string
          full_name: string
          hrms_id?: string | null
          id: string
          mandal: string
          phone: string
          qualification?: string | null
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          designation?: string
          district?: string
          division?: string | null
          email?: string
          full_name?: string
          hrms_id?: string | null
          id?: string
          mandal?: string
          phone?: string
          qualification?: string | null
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      officer_samples: {
        Row: {
          batch_no: string | null
          commodity: string
          covering_letter_json: Json
          created_at: string
          date_of_sampling: string
          dispatched_at: string | null
          firm_name: string
          id: string
          lab_report_ref: string | null
          lab_status: string
          officer_id: string
          report_received_at: string | null
          sample_code: string
          updated_at: string
        }
        Insert: {
          batch_no?: string | null
          commodity: string
          covering_letter_json?: Json
          created_at?: string
          date_of_sampling: string
          dispatched_at?: string | null
          firm_name: string
          id?: string
          lab_report_ref?: string | null
          lab_status?: string
          officer_id: string
          report_received_at?: string | null
          sample_code: string
          updated_at?: string
        }
        Update: {
          batch_no?: string | null
          commodity?: string
          covering_letter_json?: Json
          created_at?: string
          date_of_sampling?: string
          dispatched_at?: string | null
          firm_name?: string
          id?: string
          lab_report_ref?: string | null
          lab_status?: string
          officer_id?: string
          report_received_at?: string | null
          sample_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      officer_statutory_orders: {
        Row: {
          commodity: string
          created_at: string
          district: string | null
          firm_name: string
          id: string
          mandal: string | null
          officer_id: string
          order_date: string
          order_number: string
          order_type: string
          payload_json: Json
          reply_deadline: string | null
          reply_status: string
          updated_at: string
        }
        Insert: {
          commodity: string
          created_at?: string
          district?: string | null
          firm_name: string
          id?: string
          mandal?: string | null
          officer_id: string
          order_date: string
          order_number: string
          order_type: string
          payload_json?: Json
          reply_deadline?: string | null
          reply_status?: string
          updated_at?: string
        }
        Update: {
          commodity?: string
          created_at?: string
          district?: string | null
          firm_name?: string
          id?: string
          mandal?: string | null
          officer_id?: string
          order_date?: string
          order_number?: string
          order_type?: string
          payload_json?: Json
          reply_deadline?: string | null
          reply_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      officer_target_allocations: {
        Row: {
          allocated_by: string
          allocated_by_name: string | null
          code_number: string | null
          commodity: string
          created_at: string
          district: string | null
          financial_year: string
          id: string
          mandal: string
          numeric_target: number | null
          officer_id: string | null
          officer_name: string | null
          updated_at: string
        }
        Insert: {
          allocated_by: string
          allocated_by_name?: string | null
          code_number?: string | null
          commodity: string
          created_at?: string
          district?: string | null
          financial_year: string
          id?: string
          mandal: string
          numeric_target?: number | null
          officer_id?: string | null
          officer_name?: string | null
          updated_at?: string
        }
        Update: {
          allocated_by?: string
          allocated_by_name?: string | null
          code_number?: string | null
          commodity?: string
          created_at?: string
          district?: string | null
          financial_year?: string
          id?: string
          mandal?: string
          numeric_target?: number | null
          officer_id?: string | null
          officer_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quality_control_samples: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          dealer_name: string
          financial_year: string
          form_url: string | null
          id: string
          license_number: string
          location: string | null
          phone_number: string | null
          remarks: string | null
          sample_date: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          dealer_name: string
          financial_year: string
          form_url?: string | null
          id?: string
          license_number: string
          location?: string | null
          phone_number?: string | null
          remarks?: string | null
          sample_date?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          dealer_name?: string
          financial_year?: string
          form_url?: string | null
          id?: string
          license_number?: string
          location?: string | null
          phone_number?: string | null
          remarks?: string | null
          sample_date?: string | null
        }
        Relationships: []
      }
      quality_control_targets: {
        Row: {
          category: string
          created_at: string | null
          financial_year: string
          id: string
          target_count: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          financial_year: string
          id?: string
          target_count?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          financial_year?: string
          id?: string
          target_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sample_targets: {
        Row: {
          code_number: string
          commodity: string
          created_at: string
          created_by: string | null
          created_by_name: string | null
          financial_year: string
          id: string
          updated_at: string
        }
        Insert: {
          code_number: string
          commodity: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          financial_year: string
          id?: string
          updated_at?: string
        }
        Update: {
          code_number?: string
          commodity?: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          financial_year?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      scheme_beneficiaries: {
        Row: {
          beneficiaries_count: number
          created_at: string | null
          created_by: string | null
          financial_year: string
          id: string
          notes: string | null
          scheme_id: string
        }
        Insert: {
          beneficiaries_count?: number
          created_at?: string | null
          created_by?: string | null
          financial_year: string
          id?: string
          notes?: string | null
          scheme_id: string
        }
        Update: {
          beneficiaries_count?: number
          created_at?: string | null
          created_by?: string | null
          financial_year?: string
          id?: string
          notes?: string | null
          scheme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheme_beneficiaries_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "schemes"
            referencedColumns: ["id"]
          },
        ]
      }
      schemes: {
        Row: {
          beneficiary_details: string | null
          benefits: string | null
          created_at: string | null
          description: string
          eligibility: string | null
          id: string
          scheme_name: string
          updated_at: string | null
        }
        Insert: {
          beneficiary_details?: string | null
          benefits?: string | null
          created_at?: string | null
          description: string
          eligibility?: string | null
          id?: string
          scheme_name: string
          updated_at?: string | null
        }
        Update: {
          beneficiary_details?: string | null
          benefits?: string | null
          created_at?: string | null
          description?: string
          eligibility?: string | null
          id?: string
          scheme_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content: Json | null
          id: string
          section_name: string
          updated_at: string | null
        }
        Insert: {
          content?: Json | null
          id?: string
          section_name: string
          updated_at?: string | null
        }
        Update: {
          content?: Json | null
          id?: string
          section_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      site_hits: {
        Row: {
          id: string
          path: string | null
          viewed_at: string
          visitor_id: string
        }
        Insert: {
          id?: string
          path?: string | null
          viewed_at?: string
          visitor_id: string
        }
        Update: {
          id?: string
          path?: string | null
          viewed_at?: string
          visitor_id?: string
        }
        Relationships: []
      }
      stock_inventory_lines: {
        Row: {
          category: string
          closing_balance: number
          created_at: string | null
          dealer_id: string
          id: string
          opening_balance: number
          product_type: string
          receipts: number
          report_date: string
          report_month: string
          sales: number
          serial_no: number
          submitted_by: string | null
          total: number
          updated_at: string | null
        }
        Insert: {
          category: string
          closing_balance?: number
          created_at?: string | null
          dealer_id: string
          id?: string
          opening_balance?: number
          product_type: string
          receipts?: number
          report_date?: string
          report_month?: string
          sales?: number
          serial_no?: number
          submitted_by?: string | null
          total?: number
          updated_at?: string | null
        }
        Update: {
          category?: string
          closing_balance?: number
          created_at?: string | null
          dealer_id?: string
          id?: string
          opening_balance?: number
          product_type?: string
          receipts?: number
          report_date?: string
          report_month?: string
          sales?: number
          serial_no?: number
          submitted_by?: string | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_inventory_lines_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
      subsidy_cell_records: {
        Row: {
          beneficiary_list_url: string | null
          created_at: string | null
          created_by: string | null
          crop_variety: string | null
          financial_year: string
          id: string
          notes: string | null
          program: string
          quantity_allotted: number | null
          quantity_unit: string | null
          sales_data: string | null
          updated_at: string | null
        }
        Insert: {
          beneficiary_list_url?: string | null
          created_at?: string | null
          created_by?: string | null
          crop_variety?: string | null
          financial_year: string
          id?: string
          notes?: string | null
          program: string
          quantity_allotted?: number | null
          quantity_unit?: string | null
          sales_data?: string | null
          updated_at?: string | null
        }
        Update: {
          beneficiary_list_url?: string | null
          created_at?: string | null
          created_by?: string | null
          crop_variety?: string | null
          financial_year?: string
          id?: string
          notes?: string | null
          program?: string
          quantity_allotted?: number | null
          quantity_unit?: string | null
          sales_data?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tour_diaries: {
        Row: {
          closing_meter: number | null
          created_at: string
          designation: string | null
          district: string | null
          division: string | null
          id: string
          mandal: string | null
          month: number
          officer_id: string
          officer_name: string | null
          opening_meter: number | null
          status: string | null
          total_km: number | null
          updated_at: string
          year: number
        }
        Insert: {
          closing_meter?: number | null
          created_at?: string
          designation?: string | null
          district?: string | null
          division?: string | null
          id?: string
          mandal?: string | null
          month: number
          officer_id: string
          officer_name?: string | null
          opening_meter?: number | null
          status?: string | null
          total_km?: number | null
          updated_at?: string
          year: number
        }
        Update: {
          closing_meter?: number | null
          created_at?: string
          designation?: string | null
          district?: string | null
          division?: string | null
          id?: string
          mandal?: string | null
          month?: number
          officer_id?: string
          officer_name?: string | null
          opening_meter?: number | null
          status?: string | null
          total_km?: number | null
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      tour_journeys: {
        Row: {
          created_at: string
          distance_km: number | null
          from_place: string
          id: string
          journey_date: string
          meter_from: number | null
          meter_to: number | null
          mode: string
          officer_id: string
          purpose: string
          remarks: string | null
          time_from: string
          time_to: string
          to_place: string
          tour_diary_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          distance_km?: number | null
          from_place: string
          id?: string
          journey_date: string
          meter_from?: number | null
          meter_to?: number | null
          mode: string
          officer_id: string
          purpose: string
          remarks?: string | null
          time_from: string
          time_to: string
          to_place: string
          tour_diary_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          distance_km?: number | null
          from_place?: string
          id?: string
          journey_date?: string
          meter_from?: number | null
          meter_to?: number | null
          mode?: string
          officer_id?: string
          purpose?: string
          remarks?: string | null
          time_from?: string
          time_to?: string
          to_place?: string
          tour_diary_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_journeys_tour_diary_id_fkey"
            columns: ["tour_diary_id"]
            isOneToOne: false
            referencedRelation: "tour_diaries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cibrc_crops: { Args: { p_category?: string }; Returns: string[] }
      cibrc_targets: {
        Args: { p_category?: string; p_crop?: string }
        Returns: string[]
      }
      current_dealer_id: { Args: never; Returns: string }
      dealer_created_by_officer: {
        Args: { p_created_by: string }
        Returns: boolean
      }
      dealer_portal_email: { Args: { phone: string }; Returns: string }
      delete_officer_account: { Args: { p_user_id: string }; Returns: Json }
      get_dealer_login_info: {
        Args: { p_phone: string }
        Returns: {
          dealer_id: string
          dealer_name: string
          portal_email: string
        }[]
      }
      get_site_hit_summary: {
        Args: never
        Returns: {
          last_viewed_at: string
          today_views: number
          total_views: number
          unique_visitors: number
        }[]
      }
      hash_portal_password: {
        Args: { plain_password: string }
        Returns: string
      }
      is_dealer_portal_user: { Args: never; Returns: boolean }
      is_dno_officer: { Args: never; Returns: boolean }
      is_knowledge_admin: { Args: never; Returns: boolean }
      is_officer_user: { Args: never; Returns: boolean }
      is_portal_admin: { Args: never; Returns: boolean }
      knowledge_keyword_search: {
        Args: {
          p_authority?: string
          p_category?: string
          p_department?: string
          p_document_type?: string
          p_language?: string
          p_limit?: number
          p_query: string
          p_year?: number
        }
        Returns: {
          id: string
          score: number
        }[]
      }
      knowledge_vector_search: {
        Args: {
          p_authority?: string
          p_category?: string
          p_department?: string
          p_document_type?: string
          p_embedding: string
          p_language?: string
          p_limit?: number
          p_year?: number
        }
        Returns: {
          id: string
          score: number
        }[]
      }
      list_allocation_officers: {
        Args: { p_district?: string }
        Returns: {
          designation: string
          district: string
          full_name: string
          id: string
          mandal: string
        }[]
      }
      provision_all_dealer_portal_logins: {
        Args: { p_password?: string }
        Returns: Json
      }
      provision_dealer_portal_login: {
        Args: { p_dealer_id: string; p_password?: string }
        Returns: Json
      }
      record_dealer_login: { Args: { p_dealer_id: string }; Returns: undefined }
      save_officer_email_otp: {
        Args: {
          p_email: string
          p_expiry_minutes?: number
          p_otp_code: string
          p_payload?: Json
          p_purpose?: string
        }
        Returns: string
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      verify_officer_email_otp: {
        Args: { p_email: string; p_otp_code: string; p_purpose?: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
