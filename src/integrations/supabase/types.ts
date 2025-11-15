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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      custom_foods: {
        Row: {
          calories: number
          carbs: number
          created_at: string | null
          fats: number
          id: string
          name: string
          protein: number
          serving_size: number
          serving_unit: string
          user_id: string
        }
        Insert: {
          calories: number
          carbs: number
          created_at?: string | null
          fats: number
          id?: string
          name: string
          protein: number
          serving_size: number
          serving_unit: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string | null
          fats?: number
          id?: string
          name?: string
          protein?: number
          serving_size?: number
          serving_unit?: string
          user_id?: string
        }
        Relationships: []
      }
      foods: {
        Row: {
          barcode: string | null
          brand: string | null
          calories: number
          carbs: number
          created_at: string | null
          fats: number
          fiber: number | null
          id: string
          is_verified: boolean | null
          name: string
          protein: number
          serving_size: number
          serving_unit: string
          sodium: number | null
          sugar: number | null
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          calories: number
          carbs: number
          created_at?: string | null
          fats: number
          fiber?: number | null
          id?: string
          is_verified?: boolean | null
          name: string
          protein: number
          serving_size: number
          serving_unit: string
          sodium?: number | null
          sugar?: number | null
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          calories?: number
          carbs?: number
          created_at?: string | null
          fats?: number
          fiber?: number | null
          id?: string
          is_verified?: boolean | null
          name?: string
          protein?: number
          serving_size?: number
          serving_unit?: string
          sodium?: number | null
          sugar?: number | null
        }
        Relationships: []
      }
      meal_items: {
        Row: {
          calories: number
          carbs: number
          created_at: string | null
          custom_food_id: string | null
          fats: number
          food_id: string | null
          id: string
          meal_id: string
          protein: number
          quantity: number
        }
        Insert: {
          calories: number
          carbs: number
          created_at?: string | null
          custom_food_id?: string | null
          fats: number
          food_id?: string | null
          id?: string
          meal_id: string
          protein: number
          quantity: number
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string | null
          custom_food_id?: string | null
          fats?: number
          food_id?: string | null
          id?: string
          meal_id?: string
          protein?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "meal_items_custom_food_id_fkey"
            columns: ["custom_food_id"]
            isOneToOne: false
            referencedRelation: "custom_foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_items_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          created_at: string | null
          id: string
          is_favorite: boolean | null
          logged_at: string | null
          meal_type: string | null
          name: string | null
          notes: string | null
          photo_url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          logged_at?: string | null
          meal_type?: string | null
          name?: string | null
          notes?: string | null
          photo_url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          logged_at?: string | null
          meal_type?: string | null
          name?: string | null
          notes?: string | null
          photo_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string | null
          add_burned_calories: boolean | null
          age: number | null
          created_at: string | null
          current_weight_kg: number | null
          daily_calorie_goal: number | null
          daily_carbs_goal: number | null
          daily_fats_goal: number | null
          daily_protein_goal: number | null
          daily_steps_goal: number | null
          daily_water_goal_ml: number | null
          gender: string | null
          goal_weight_kg: number | null
          height_cm: number | null
          id: string
          starting_weight_kg: number | null
          updated_at: string | null
        }
        Insert: {
          activity_level?: string | null
          add_burned_calories?: boolean | null
          age?: number | null
          created_at?: string | null
          current_weight_kg?: number | null
          daily_calorie_goal?: number | null
          daily_carbs_goal?: number | null
          daily_fats_goal?: number | null
          daily_protein_goal?: number | null
          daily_steps_goal?: number | null
          daily_water_goal_ml?: number | null
          gender?: string | null
          goal_weight_kg?: number | null
          height_cm?: number | null
          id: string
          starting_weight_kg?: number | null
          updated_at?: string | null
        }
        Update: {
          activity_level?: string | null
          add_burned_calories?: boolean | null
          age?: number | null
          created_at?: string | null
          current_weight_kg?: number | null
          daily_calorie_goal?: number | null
          daily_carbs_goal?: number | null
          daily_fats_goal?: number | null
          daily_protein_goal?: number | null
          daily_steps_goal?: number | null
          daily_water_goal_ml?: number | null
          gender?: string | null
          goal_weight_kg?: number | null
          height_cm?: number | null
          id?: string
          starting_weight_kg?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recipes: {
        Row: {
          calories: number | null
          carbs: number | null
          created_at: string | null
          description: string | null
          fats: number | null
          id: string
          image_url: string | null
          is_popular: boolean | null
          meal_type: string | null
          name: string
          prep_time_minutes: number | null
          protein: number | null
          servings: number | null
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          description?: string | null
          fats?: number | null
          id?: string
          image_url?: string | null
          is_popular?: boolean | null
          meal_type?: string | null
          name: string
          prep_time_minutes?: number | null
          protein?: number | null
          servings?: number | null
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          description?: string | null
          fats?: number | null
          id?: string
          image_url?: string | null
          is_popular?: boolean | null
          meal_type?: string | null
          name?: string
          prep_time_minutes?: number | null
          protein?: number | null
          servings?: number | null
        }
        Relationships: []
      }
      step_logs: {
        Row: {
          created_at: string | null
          id: string
          logged_at: string | null
          steps: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          logged_at?: string | null
          steps: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          logged_at?: string | null
          steps?: number
          user_id?: string
        }
        Relationships: []
      }
      water_logs: {
        Row: {
          amount_ml: number
          created_at: string | null
          id: string
          logged_at: string | null
          user_id: string
        }
        Insert: {
          amount_ml: number
          created_at?: string | null
          id?: string
          logged_at?: string | null
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string | null
          id?: string
          logged_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          created_at: string | null
          id: string
          logged_at: string | null
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          logged_at?: string | null
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string | null
          id?: string
          logged_at?: string | null
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
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
    Enums: {},
  },
} as const
