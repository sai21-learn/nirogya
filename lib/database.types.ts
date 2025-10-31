export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      appointments: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string
          appointment_date: string
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          consultation_type: 'in-person' | 'video'
          patient_notes: string | null
          symptoms: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          doctor_id: string
          appointment_date: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          consultation_type: 'in-person' | 'video'
          patient_notes?: string | null
          symptoms?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          doctor_id?: string
          appointment_date?: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          consultation_type?: 'in-person' | 'video'
          patient_notes?: string | null
          symptoms?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      doctors: {
        Row: {
          id: string
          user_id: string
          specialization: string
          consultation_fee: number
          address: Json
          consultation_types: string[]
          bio: string | null
          experience_years: number | null
          qualifications: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          specialization: string
          consultation_fee: number
          address: Json
          consultation_types: string[]
          bio?: string | null
          experience_years?: number | null
          qualifications?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          specialization?: string
          consultation_fee?: number
          address?: Json
          consultation_types?: string[]
          bio?: string | null
          experience_years?: number | null
          qualifications?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
