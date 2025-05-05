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
      services: {
        Row: {
          id: string
          name: string
          description: string
          duration_minutes: number
          price_cents: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          duration_minutes: number
          price_cents: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          duration_minutes?: number
          price_cents?: number
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          service_id: string
          client_name: string
          client_email: string
          start_time: string
          end_time: string
          calendar_event_id: string | null
          payment_intent_id: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          service_id: string
          client_name: string
          client_email: string
          start_time: string
          end_time: string
          calendar_event_id?: string | null
          payment_intent_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          service_id?: string
          client_name?: string
          client_email?: string
          start_time?: string
          end_time?: string
          calendar_event_id?: string | null
          payment_intent_id?: string | null
          status?: string
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
  }
}
