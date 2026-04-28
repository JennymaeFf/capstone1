export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type InventoryType = "ingredient" | "packaging" | "addon" | "beverage";

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: { name: string; icon: string | null; display_order: number; created_at: string };
        Insert: { name: string; icon?: string | null; display_order?: number; created_at?: string };
        Update: { name?: string; icon?: string | null; display_order?: number; created_at?: string };
        Relationships: [];
      };
      menu_items: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          image_url: string;
          category: string;
          base_price: number;
          is_manually_available: boolean;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          image_url: string;
          category: string;
          base_price: number;
          is_manually_available?: boolean;
          is_available?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          image_url?: string;
          category?: string;
          base_price?: number;
          is_manually_available?: boolean;
          is_available?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      inventory_items: {
        Row: {
          id: string;
          name: string;
          inventory_type: InventoryType;
          quantity: number;
          unit: string;
          low_stock_level: number;
          package_scope: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          inventory_type: InventoryType;
          quantity?: number;
          unit?: string;
          low_stock_level?: number;
          package_scope?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          inventory_type?: InventoryType;
          quantity?: number;
          unit?: string;
          low_stock_level?: number;
          package_scope?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      menu_item_inventory_requirements: {
        Row: { id: string; menu_item_id: string; inventory_item_id: string; quantity_required: number; created_at: string };
        Insert: { id?: string; menu_item_id: string; inventory_item_id: string; quantity_required: number; created_at?: string };
        Update: { id?: string; menu_item_id?: string; inventory_item_id?: string; quantity_required?: number; created_at?: string };
        Relationships: [];
      };
      menu_item_addons: {
        Row: {
          id: string;
          menu_item_id: string;
          inventory_item_id: string;
          price_delta: number;
          quantity_required: number;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          menu_item_id: string;
          inventory_item_id: string;
          price_delta?: number;
          quantity_required?: number;
          is_available?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          menu_item_id?: string;
          inventory_item_id?: string;
          price_delta?: number;
          quantity_required?: number;
          is_available?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          address: string | null;
          avatar_url: string | null;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          address?: string | null;
          avatar_url?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          address?: string | null;
          avatar_url?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      app_users: {
        Row: {
          id: string;
          role: "admin" | "customer";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: "admin" | "customer";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: "admin" | "customer";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      otp_verifications: {
        Row: {
          key: string;
          email: string;
          purpose: "registration" | "login";
          code_hash: string;
          attempts: number;
          expires_at: string;
          resend_available_at: string;
          created_at: string;
        };
        Insert: {
          key: string;
          email: string;
          purpose: "registration" | "login";
          code_hash: string;
          attempts?: number;
          expires_at: string;
          resend_available_at: string;
          created_at?: string;
        };
        Update: {
          key?: string;
          email?: string;
          purpose?: "registration" | "login";
          code_hash?: string;
          attempts?: number;
          expires_at?: string;
          resend_available_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          status: string;
          total_amount: number;
          subtotal_amount: number;
          phone: string;
          address: string;
          delivery_option: string;
          delivery_distance_km: number;
          delivery_fee: number;
          payment_method: string;
          selected_bank: string | null;
          payment_reference: string | null;
          payment_proof_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: string;
          total_amount: number;
          subtotal_amount?: number;
          phone: string;
          address: string;
          delivery_option?: string;
          delivery_distance_km?: number;
          delivery_fee?: number;
          payment_method: string;
          selected_bank?: string | null;
          payment_reference?: string | null;
          payment_proof_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: string;
          total_amount?: number;
          subtotal_amount?: number;
          phone?: string;
          address?: string;
          delivery_option?: string;
          delivery_distance_km?: number;
          delivery_fee?: number;
          payment_method?: string;
          selected_bank?: string | null;
          payment_reference?: string | null;
          payment_proof_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string | null;
          item_name: string;
          image_url: string;
          size_label: string | null;
          unit_price: number;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id?: string | null;
          item_name: string;
          image_url: string;
          size_label?: string | null;
          unit_price: number;
          quantity: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          menu_item_id?: string | null;
          item_name?: string;
          image_url?: string;
          size_label?: string | null;
          unit_price?: number;
          quantity?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      order_addons: {
        Row: {
          id: string;
          order_item_id: string;
          inventory_item_id: string | null;
          addon_name: string;
          price_delta: number;
          total_price: number;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_item_id: string;
          inventory_item_id?: string | null;
          addon_name: string;
          price_delta?: number;
          total_price?: number;
          quantity: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_item_id?: string;
          inventory_item_id?: string | null;
          addon_name?: string;
          price_delta?: number;
          total_price?: number;
          quantity?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          email: string;
          message: string;
          admin_reply: string | null;
          customer_reply: string | null;
          status: "Unread" | "Read" | "Replied";
          customer_seen: boolean;
          created_at: string;
          replied_at: string | null;
          customer_replied_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          email: string;
          message: string;
          admin_reply?: string | null;
          customer_reply?: string | null;
          status?: "Unread" | "Read" | "Replied";
          customer_seen?: boolean;
          created_at?: string;
          replied_at?: string | null;
          customer_replied_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          email?: string;
          message?: string;
          admin_reply?: string | null;
          customer_reply?: string | null;
          status?: "Unread" | "Read" | "Replied";
          customer_seen?: boolean;
          created_at?: string;
          replied_at?: string | null;
          customer_replied_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      place_order_with_inventory: {
        Args: {
          p_phone: string;
          p_address: string;
          p_payment_method: string;
          p_total_amount: number;
          p_items: Json;
          p_subtotal_amount?: number;
          p_delivery_option?: string;
          p_delivery_distance_km?: number;
          p_delivery_fee?: number;
          p_selected_bank?: string | null;
          p_payment_reference?: string | null;
          p_payment_proof_url?: string | null;
        };
        Returns: string;
      };
      sync_menu_item_availability: {
        Args: { p_menu_item_id?: string | null };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
