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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      access_requests: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          requested_role: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          requested_role?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          requested_role?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: []
      }
      car_numbers: {
        Row: {
          car_number: string
          created_at: string
          created_by: string | null
          id: string
        }
        Insert: {
          car_number: string
          created_at?: string
          created_by?: string | null
          id?: string
        }
        Update: {
          car_number?: string
          created_at?: string
          created_by?: string | null
          id?: string
        }
        Relationships: []
      }
      driver_expenses: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string | null
          driver_id: string
          expense_date: string
          expense_type: string
          id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          driver_id: string
          expense_date?: string
          expense_type: string
          id?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          driver_id?: string
          expense_date?: string
          expense_type?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_expenses_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_payments: {
        Row: {
          created_at: string
          created_by: string | null
          driver_id: string
          id: string
          notes: string | null
          payment_amount: number
          payment_date: string
          payment_mode: string
          reference_number: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          driver_id: string
          id?: string
          notes?: string | null
          payment_amount?: number
          payment_date?: string
          payment_mode: string
          reference_number?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          driver_id?: string
          id?: string
          notes?: string | null
          payment_amount?: number
          payment_date?: string
          payment_mode?: string
          reference_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_payments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_trip_amounts: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          driver_id: string
          id: string
          trip_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          driver_id: string
          id?: string
          trip_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          driver_id?: string
          id?: string
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_trip_amounts_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_trip_amounts_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: true
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_trip_amounts_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: true
            referencedRelation: "trips_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          aadhaar: string | null
          address: string | null
          created_at: string
          created_by: string | null
          id: string
          joining_date: string | null
          license_number: string | null
          mobile: string | null
          name: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          aadhaar?: string | null
          address?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          joining_date?: string | null
          license_number?: string | null
          mobile?: string | null
          name: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          aadhaar?: string | null
          address?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          joining_date?: string | null
          license_number?: string | null
          mobile?: string | null
          name?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      login_history: {
        Row: {
          id: string
          ip_address: string | null
          login_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          id?: string
          ip_address?: string | null
          login_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          id?: string
          ip_address?: string | null
          login_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      maintenance: {
        Row: {
          amount: number
          company: string | null
          created_at: string | null
          created_by: string | null
          date: string
          description: string | null
          driver_name: string
          driver_number: string
          id: string
          km_at_maintenance: number | null
          maintenance_type: string
          next_oil_change_km: number | null
          original_odometer_km: number | null
          payment_mode: string
          updated_at: string | null
          vehicle_number: string
        }
        Insert: {
          amount?: number
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          date: string
          description?: string | null
          driver_name: string
          driver_number: string
          id?: string
          km_at_maintenance?: number | null
          maintenance_type: string
          next_oil_change_km?: number | null
          original_odometer_km?: number | null
          payment_mode?: string
          updated_at?: string | null
          vehicle_number: string
        }
        Update: {
          amount?: number
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string | null
          driver_name?: string
          driver_number?: string
          id?: string
          km_at_maintenance?: number | null
          maintenance_type?: string
          next_oil_change_km?: number | null
          original_odometer_km?: number | null
          payment_mode?: string
          updated_at?: string | null
          vehicle_number?: string
        }
        Relationships: []
      }
      outside_vehicle_trips: {
        Row: {
          car_number: string | null
          created_at: string | null
          created_by: string | null
          date: string
          driver_name: string
          driver_number: string
          from_location: string
          id: string
          payment_mode: string
          payment_status: string
          to_location: string
          travel_company: string
          trip_amount: number
          trip_given_company: string
          updated_at: string | null
          vehicle_number: string
          vehicle_type: string
        }
        Insert: {
          car_number?: string | null
          created_at?: string | null
          created_by?: string | null
          date: string
          driver_name: string
          driver_number: string
          from_location: string
          id?: string
          payment_mode: string
          payment_status?: string
          to_location: string
          travel_company: string
          trip_amount?: number
          trip_given_company: string
          updated_at?: string | null
          vehicle_number: string
          vehicle_type: string
        }
        Update: {
          car_number?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          driver_name?: string
          driver_number?: string
          from_location?: string
          id?: string
          payment_mode?: string
          payment_status?: string
          to_location?: string
          travel_company?: string
          trip_amount?: number
          trip_given_company?: string
          updated_at?: string | null
          vehicle_number?: string
          vehicle_type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          last_login: string | null
          login_count: number | null
          role: Database["public"]["Enums"]["user_role"] | null
          status: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          last_login?: string | null
          login_count?: number | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          last_login?: string | null
          login_count?: number | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          car_number: string | null
          commission: number
          company: string | null
          created_at: string | null
          created_by: string | null
          customer_name: string
          customer_number: string
          date: string
          driver_amount: number
          driver_id: string | null
          driver_name: string
          driver_number: string
          ending_km: number | null
          from_location: string
          fuel_amount: number
          fuel_litres: number | null
          fuel_type: string
          id: string
          payment_mode: string
          payment_status: string
          profit: number | null
          starting_km: number | null
          to_location: string
          tolls: number
          trip_amount: number
          updated_at: string | null
        }
        Insert: {
          car_number?: string | null
          commission?: number
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_name: string
          customer_number: string
          date: string
          driver_amount?: number
          driver_id?: string | null
          driver_name: string
          driver_number: string
          ending_km?: number | null
          from_location: string
          fuel_amount?: number
          fuel_litres?: number | null
          fuel_type: string
          id?: string
          payment_mode: string
          payment_status?: string
          profit?: number | null
          starting_km?: number | null
          to_location: string
          tolls?: number
          trip_amount?: number
          updated_at?: string | null
        }
        Update: {
          car_number?: string | null
          commission?: number
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_name?: string
          customer_number?: string
          date?: string
          driver_amount?: number
          driver_id?: string | null
          driver_name?: string
          driver_number?: string
          ending_km?: number | null
          from_location?: string
          fuel_amount?: number
          fuel_litres?: number | null
          fuel_type?: string
          id?: string
          payment_mode?: string
          payment_status?: string
          profit?: number | null
          starting_km?: number | null
          to_location?: string
          tolls?: number
          trip_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_alignment: {
        Row: {
          alignment_interval_km: number
          created_at: string | null
          created_by: string | null
          id: string
          last_alignment_date: string | null
          last_alignment_km: number
          updated_at: string | null
          vehicle_number: string
        }
        Insert: {
          alignment_interval_km?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_alignment_date?: string | null
          last_alignment_km?: number
          updated_at?: string | null
          vehicle_number: string
        }
        Update: {
          alignment_interval_km?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_alignment_date?: string | null
          last_alignment_km?: number
          updated_at?: string | null
          vehicle_number?: string
        }
        Relationships: []
      }
      vehicle_battery: {
        Row: {
          brand: string | null
          cost: number
          created_at: string
          created_by: string | null
          expected_life_months: number
          id: string
          last_replacement_date: string
          model: string | null
          notes: string | null
          updated_at: string
          vehicle_number: string
        }
        Insert: {
          brand?: string | null
          cost?: number
          created_at?: string
          created_by?: string | null
          expected_life_months?: number
          id?: string
          last_replacement_date: string
          model?: string | null
          notes?: string | null
          updated_at?: string
          vehicle_number: string
        }
        Update: {
          brand?: string | null
          cost?: number
          created_at?: string
          created_by?: string | null
          expected_life_months?: number
          id?: string
          last_replacement_date?: string
          model?: string | null
          notes?: string | null
          updated_at?: string
          vehicle_number?: string
        }
        Relationships: []
      }
      vehicle_emi: {
        Row: {
          created_at: string | null
          created_by: string | null
          emi_amount: number
          emi_day: number
          end_date: string
          id: string
          start_date: string
          updated_at: string | null
          vehicle_number: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          emi_amount?: number
          emi_day?: number
          end_date: string
          id?: string
          start_date: string
          updated_at?: string | null
          vehicle_number: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          emi_amount?: number
          emi_day?: number
          end_date?: string
          id?: string
          start_date?: string
          updated_at?: string | null
          vehicle_number?: string
        }
        Relationships: []
      }
      vehicle_fc: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          expiry_date: string
          fc_number: string | null
          id: string
          issue_date: string
          updated_at: string
          vehicle_number: string
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          expiry_date: string
          fc_number?: string | null
          id?: string
          issue_date: string
          updated_at?: string
          vehicle_number: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          expiry_date?: string
          fc_number?: string | null
          id?: string
          issue_date?: string
          updated_at?: string
          vehicle_number?: string
        }
        Relationships: []
      }
      vehicle_insurance: {
        Row: {
          created_at: string | null
          created_by: string | null
          expiry_date: string
          id: string
          insurance_company: string | null
          policy_number: string | null
          premium_amount: number | null
          start_date: string
          updated_at: string | null
          vehicle_number: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expiry_date: string
          id?: string
          insurance_company?: string | null
          policy_number?: string | null
          premium_amount?: number | null
          start_date: string
          updated_at?: string | null
          vehicle_number: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expiry_date?: string
          id?: string
          insurance_company?: string | null
          policy_number?: string | null
          premium_amount?: number | null
          start_date?: string
          updated_at?: string | null
          vehicle_number?: string
        }
        Relationships: []
      }
      vehicle_oil_change: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          last_oil_change_date: string
          last_oil_change_km: number
          next_oil_change_date: string | null
          next_oil_change_km: number | null
          oil_type: string | null
          updated_at: string | null
          vehicle_number: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_oil_change_date: string
          last_oil_change_km?: number
          next_oil_change_date?: string | null
          next_oil_change_km?: number | null
          oil_type?: string | null
          updated_at?: string | null
          vehicle_number: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_oil_change_date?: string
          last_oil_change_km?: number
          next_oil_change_date?: string | null
          next_oil_change_km?: number | null
          oil_type?: string | null
          updated_at?: string | null
          vehicle_number?: string
        }
        Relationships: []
      }
      vehicle_permit: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          expiry_date: string
          id: string
          issue_date: string
          issuing_state: string | null
          permit_number: string | null
          updated_at: string
          vehicle_number: string
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          expiry_date: string
          id?: string
          issue_date: string
          issuing_state?: string | null
          permit_number?: string | null
          updated_at?: string
          vehicle_number: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          expiry_date?: string
          id?: string
          issue_date?: string
          issuing_state?: string | null
          permit_number?: string | null
          updated_at?: string
          vehicle_number?: string
        }
        Relationships: []
      }
      vehicle_pollution: {
        Row: {
          certificate_number: string | null
          created_at: string | null
          created_by: string | null
          expiry_date: string
          id: string
          issue_date: string
          updated_at: string | null
          vehicle_number: string
        }
        Insert: {
          certificate_number?: string | null
          created_at?: string | null
          created_by?: string | null
          expiry_date: string
          id?: string
          issue_date: string
          updated_at?: string | null
          vehicle_number: string
        }
        Update: {
          certificate_number?: string | null
          created_at?: string | null
          created_by?: string | null
          expiry_date?: string
          id?: string
          issue_date?: string
          updated_at?: string | null
          vehicle_number?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          chassis_number: string | null
          colour: string | null
          created_at: string
          created_by: string | null
          engine_number: string | null
          fuel_type: string | null
          id: string
          make: string | null
          model: string | null
          notes: string | null
          owner_name: string | null
          purchase_date: string | null
          registration_date: string | null
          seating_capacity: number | null
          status: string
          updated_at: string
          vehicle_number: string
          year: number | null
        }
        Insert: {
          chassis_number?: string | null
          colour?: string | null
          created_at?: string
          created_by?: string | null
          engine_number?: string | null
          fuel_type?: string | null
          id?: string
          make?: string | null
          model?: string | null
          notes?: string | null
          owner_name?: string | null
          purchase_date?: string | null
          registration_date?: string | null
          seating_capacity?: number | null
          status?: string
          updated_at?: string
          vehicle_number: string
          year?: number | null
        }
        Update: {
          chassis_number?: string | null
          colour?: string | null
          created_at?: string
          created_by?: string | null
          engine_number?: string | null
          fuel_type?: string | null
          id?: string
          make?: string | null
          model?: string | null
          notes?: string | null
          owner_name?: string | null
          purchase_date?: string | null
          registration_date?: string | null
          seating_capacity?: number | null
          status?: string
          updated_at?: string
          vehicle_number?: string
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      maintenance_secure: {
        Row: {
          amount: number | null
          company: string | null
          created_at: string | null
          created_by: string | null
          date: string | null
          description: string | null
          driver_name: string | null
          driver_number: string | null
          id: string | null
          km_at_maintenance: number | null
          maintenance_type: string | null
          next_oil_change_km: number | null
          original_odometer_km: number | null
          payment_mode: string | null
          updated_at: string | null
          vehicle_number: string | null
        }
        Insert: {
          amount?: number | null
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          description?: string | null
          driver_name?: string | null
          driver_number?: never
          id?: string | null
          km_at_maintenance?: number | null
          maintenance_type?: string | null
          next_oil_change_km?: number | null
          original_odometer_km?: number | null
          payment_mode?: string | null
          updated_at?: string | null
          vehicle_number?: string | null
        }
        Update: {
          amount?: number | null
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          description?: string | null
          driver_name?: string | null
          driver_number?: never
          id?: string | null
          km_at_maintenance?: number | null
          maintenance_type?: string | null
          next_oil_change_km?: number | null
          original_odometer_km?: number | null
          payment_mode?: string | null
          updated_at?: string | null
          vehicle_number?: string | null
        }
        Relationships: []
      }
      trips_secure: {
        Row: {
          commission: number | null
          company: string | null
          created_at: string | null
          created_by: string | null
          customer_name: string | null
          customer_number: string | null
          date: string | null
          driver_amount: number | null
          driver_name: string | null
          driver_number: string | null
          from_location: string | null
          fuel_amount: number | null
          fuel_type: string | null
          id: string | null
          payment_mode: string | null
          payment_status: string | null
          profit: number | null
          to_location: string | null
          tolls: number | null
          trip_amount: number | null
          updated_at: string | null
        }
        Insert: {
          commission?: number | null
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_name?: string | null
          customer_number?: string | null
          date?: string | null
          driver_amount?: number | null
          driver_name?: string | null
          driver_number?: string | null
          from_location?: string | null
          fuel_amount?: number | null
          fuel_type?: string | null
          id?: string | null
          payment_mode?: string | null
          payment_status?: string | null
          profit?: number | null
          to_location?: string | null
          tolls?: number | null
          trip_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          commission?: number | null
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_name?: string | null
          customer_number?: string | null
          date?: string | null
          driver_amount?: number | null
          driver_name?: string | null
          driver_number?: string | null
          from_location?: string | null
          fuel_amount?: number | null
          fuel_type?: string | null
          id?: string | null
          payment_mode?: string | null
          payment_status?: string | null
          profit?: number | null
          to_location?: string | null
          tolls?: number | null
          trip_amount?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "admin" | "driver1" | "driver2" | "driver3"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["admin", "driver1", "driver2", "driver3"],
    },
  },
} as const
