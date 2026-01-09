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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
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
          travel_name: string
          trip_amount: number
          trip_given_company: string
          updated_at: string | null
          vehicle_type: string
        }
        Insert: {
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
          travel_name: string
          trip_amount?: number
          trip_given_company: string
          updated_at?: string | null
          vehicle_type: string
        }
        Update: {
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
          travel_name?: string
          trip_amount?: number
          trip_given_company?: string
          updated_at?: string | null
          vehicle_type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          commission: number
          company: string | null
          created_at: string | null
          created_by: string | null
          customer_name: string
          customer_number: string
          date: string
          driver_amount: number
          driver_name: string
          driver_number: string
          from_location: string
          fuel_amount: number
          fuel_type: string
          id: string
          payment_mode: string
          payment_status: string
          profit: number | null
          to_location: string
          tolls: number
          trip_amount: number
          updated_at: string | null
        }
        Insert: {
          commission?: number
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_name: string
          customer_number: string
          date: string
          driver_amount?: number
          driver_name: string
          driver_number: string
          from_location: string
          fuel_amount?: number
          fuel_type: string
          id?: string
          payment_mode: string
          payment_status?: string
          profit?: number | null
          to_location: string
          tolls?: number
          trip_amount?: number
          updated_at?: string | null
        }
        Update: {
          commission?: number
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_name?: string
          customer_number?: string
          date?: string
          driver_amount?: number
          driver_name?: string
          driver_number?: string
          from_location?: string
          fuel_amount?: number
          fuel_type?: string
          id?: string
          payment_mode?: string
          payment_status?: string
          profit?: number | null
          to_location?: string
          tolls?: number
          trip_amount?: number
          updated_at?: string | null
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
