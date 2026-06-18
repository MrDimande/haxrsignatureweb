export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string;
          name: string;
          logo: string | null;
          nuit: string | null;
          phone: string | null;
          email: string | null;
          whatsapp: string | null;
          address: string | null;
          invoice_prefix: string;
          default_currency: "MZN" | "USD" | "ZAR";
          theme: Json;
          terms_and_conditions: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          logo?: string | null;
          nuit?: string | null;
          phone?: string | null;
          email?: string | null;
          whatsapp?: string | null;
          address?: string | null;
          invoice_prefix?: string;
          default_currency?: "MZN" | "USD" | "ZAR";
          theme?: Json;
          terms_and_conditions?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["businesses"]["Insert"]>;
      };
      business_bank_accounts: {
        Row: {
          id: string;
          business_id: string;
          bank_name: string;
          account_name: string;
          account_number: string;
          nib: string;
          swift: string | null;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          bank_name: string;
          account_name: string;
          account_number: string;
          nib: string;
          swift?: string | null;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["business_bank_accounts"]["Insert"]
        >;
      };
      business_mobile_payments: {
        Row: {
          id: string;
          business_id: string;
          provider: string;
          number: string;
          account_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          provider: string;
          number: string;
          account_name: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["business_mobile_payments"]["Insert"]
        >;
      };
      business_signatures: {
        Row: {
          id: string;
          business_id: string;
          label: string;
          role_title: string;
          image_data: string;
          mime_type: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          label: string;
          role_title?: string;
          image_data: string;
          mime_type?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["business_signatures"]["Insert"]
        >;
      };
      service_catalog: {
        Row: {
          id: string;
          business_id: string | null;
          name: string;
          description: string | null;
          price: number;
          category:
            | "invitations"
            | "websites"
            | "assessoria"
            | "branding"
            | "experiences"
            | "event_packages"
            | "addons"
            | "coordination"
            | "media";
          currency: "MZN" | "USD" | "ZAR";
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          business_id?: string | null;
          name: string;
          description?: string | null;
          price: number;
          category?:
            | "invitations"
            | "websites"
            | "assessoria"
            | "branding"
            | "experiences"
            | "event_packages"
            | "addons"
            | "coordination"
            | "media";
          currency?: "MZN" | "USD" | "ZAR";
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["service_catalog"]["Insert"]>;
      };
      clients: {
        Row: {
          id: string;
          client_name: string;
          client_type: "individual" | "company";
          company_name: string;
          nuit: string;
          email: string;
          phone: string;
          address: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_name: string;
          client_type?: "individual" | "company";
          company_name?: string;
          nuit?: string;
          email?: string;
          phone?: string;
          address?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
      };
      documents: {
        Row: {
          id: string;
          business_id: string;
          document_type: "proforma" | "invoice" | "receipt";
          document_number: string;
          status: "draft" | "sent" | "paid" | "cancelled";
          currency: "MZN" | "USD" | "ZAR";
          client_id: string | null;
          client_type: "individual" | "company";
          client_name: string;
          company_name: string;
          client_nuit: string;
          client_email: string;
          client_phone: string;
          client_address: string;
          event_id: string | null;
          event_type:
            | "wedding"
            | "birthday"
            | "corporate"
            | "baby_shower"
            | "graduation"
            | "other"
            | null;
          event_name: string;
          event_date: string | null;
          event_location: string;
          issue_date: string;
          expiry_date: string;
          notes: string;
          subtotal: number;
          vat_rate: number;
          vat_amount: number;
          grand_total: number;
          include_vat: boolean;
          issuer_signature_id: string | null;
          issuer_name: string;
          issuer_role: string;
          issuer_signature_image: string;
          pdf_generated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          document_type: "proforma" | "invoice" | "receipt";
          document_number: string;
          status?: "draft" | "sent" | "paid" | "cancelled";
          currency?: "MZN" | "USD" | "ZAR";
          client_id?: string | null;
          client_type?: "individual" | "company";
          client_name?: string;
          company_name?: string;
          client_nuit?: string;
          client_email?: string;
          client_phone?: string;
          client_address?: string;
          event_id?: string | null;
          event_type?:
            | "wedding"
            | "birthday"
            | "corporate"
            | "baby_shower"
            | "graduation"
            | "other"
            | null;
          event_name?: string;
          event_date?: string | null;
          event_location?: string;
          issue_date: string;
          expiry_date: string;
          notes?: string;
          subtotal: number;
          vat_rate: number;
          vat_amount: number;
          grand_total: number;
          include_vat: boolean;
          issuer_signature_id?: string | null;
          issuer_name?: string;
          issuer_role?: string;
          issuer_signature_image?: string;
          pdf_generated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
      };
      document_line_items: {
        Row: {
          id: string;
          document_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          total: number;
          sort_order: number;
          catalog_service_id: string | null;
          item_source: "catalog" | "manual";
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          description?: string;
          quantity?: number;
          unit_price?: number;
          total?: number;
          sort_order?: number;
          catalog_service_id?: string | null;
          item_source?: "catalog" | "manual";
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["document_line_items"]["Insert"]
        >;
      };
      document_sequences: {
        Row: {
          business_id: string;
          document_type: "proforma" | "invoice" | "receipt";
          year: number;
          last_sequence: number;
        };
        Insert: {
          business_id: string;
          document_type: "proforma" | "invoice" | "receipt";
          year: number;
          last_sequence?: number;
        };
        Update: Partial<
          Database["public"]["Tables"]["document_sequences"]["Insert"]
        >;
      };
      finance_expenses: {
        Row: {
          id: string;
          business_id: string;
          event_id: string | null;
          category:
            | "production"
            | "suppliers"
            | "marketing"
            | "logistics"
            | "payroll"
            | "other";
          description: string;
          amount: number;
          currency: "MZN" | "USD" | "ZAR";
          expense_date: string;
          reference: string;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          event_id?: string | null;
          category?:
            | "production"
            | "suppliers"
            | "marketing"
            | "logistics"
            | "payroll"
            | "other";
          description: string;
          amount: number;
          currency?: "MZN" | "USD" | "ZAR";
          expense_date?: string;
          reference?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["finance_expenses"]["Insert"]
        >;
      };
      finance_monthly_targets: {
        Row: {
          id: string;
          business_id: string;
          year: number;
          month: number;
          target_amount: number;
          currency: "MZN" | "USD" | "ZAR";
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          year: number;
          month: number;
          target_amount: number;
          currency?: "MZN" | "USD" | "ZAR";
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["finance_monthly_targets"]["Insert"]
        >;
      };
      payments: {
        Row: {
          id: string;
          business_id: string;
          client_id: string | null;
          event_id: string | null;
          document_id: string | null;
          source_document_id: string | null;
          amount: number;
          currency: "MZN" | "USD" | "ZAR";
          payment_method:
            | "cash"
            | "bank_transfer"
            | "mpesa"
            | "emola"
            | "card"
            | "other";
          reference: string;
          notes: string;
          paid_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          client_id?: string | null;
          event_id?: string | null;
          document_id?: string | null;
          source_document_id?: string | null;
          amount: number;
          currency?: "MZN" | "USD" | "ZAR";
          payment_method?:
            | "cash"
            | "bank_transfer"
            | "mpesa"
            | "emola"
            | "card"
            | "other";
          reference?: string;
          notes?: string;
          paid_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
      };
      contact_inquiries: {
        Row: {
          id: string;
          name: string;
          email: string;
          project_type: string;
          package_label: string | null;
          intent: string | null;
          message: string;
          status: "new" | "contacted" | "converted" | "archived";
          marketing_opt_in: boolean;
          source: string;
          created_at: string;
          updated_at: string;
          brevo_lead_welcome_at: string | null;
          brevo_portfolio_sent_at: string | null;
          brevo_experiences_sent_at: string | null;
          brevo_meeting_sent_at: string | null;
          brevo_last_call_sent_at: string | null;
          brevo_newsletter_welcome_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          project_type: string;
          package_label?: string | null;
          intent?: string | null;
          message?: string;
          status?: "new" | "contacted" | "converted" | "archived";
          marketing_opt_in?: boolean;
          source?: string;
          created_at?: string;
          updated_at?: string;
          brevo_lead_welcome_at?: string | null;
          brevo_portfolio_sent_at?: string | null;
          brevo_experiences_sent_at?: string | null;
          brevo_meeting_sent_at?: string | null;
          brevo_last_call_sent_at?: string | null;
          brevo_newsletter_welcome_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["contact_inquiries"]["Insert"]
        >;
      };
      events: {
        Row: {
          id: string;
          business_id: string;
          client_id: string | null;
          name: string;
          type:
            | "wedding"
            | "birthday"
            | "corporate"
            | "baby_shower"
            | "graduation"
            | "other";
          date: string | null;
          location: string;
          notes: string;
          is_active: boolean;
          google_sheet_url: string;
          google_sheet_gid: string;
          sheets_last_synced_at: string | null;
          sheets_sync_summary: string;
          sheets_sync_mode: "master" | "rsvp";
          find_seat_code: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          client_id?: string | null;
          name: string;
          type?:
            | "wedding"
            | "birthday"
            | "corporate"
            | "baby_shower"
            | "graduation"
            | "other";
          date?: string | null;
          location?: string;
          notes?: string;
          is_active?: boolean;
          google_sheet_url?: string;
          google_sheet_gid?: string;
          sheets_last_synced_at?: string | null;
          sheets_sync_summary?: string;
          sheets_sync_mode?: "master" | "rsvp";
          find_seat_code?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
      };
      seats: {
        Row: {
          id: string;
          event_id: string;
          table_name: string;
          seat_number: number;
          label: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          table_name: string;
          seat_number?: number;
          label?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["seats"]["Insert"]>;
      };
      guest_groups: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          name?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["guest_groups"]["Insert"]>;
      };
      guests: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          name_normalized: string;
          email: string;
          phone: string;
          client_type: "individual" | "company";
          seat_id: string | null;
          group_id: string | null;
          qr_token: string;
          status: "invited" | "confirmed" | "checked_in" | "declined";
          plus_ones: number;
          dietary_notes: string;
          guest_notes: string;
          label: "none" | "vip" | "family" | "wedding_party" | "corporate" | "other";
          guest_source: "manual" | "sheet_master" | "sheet_rsvp";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          name_normalized?: string;
          email?: string;
          phone?: string;
          client_type?: "individual" | "company";
          seat_id?: string | null;
          group_id?: string | null;
          qr_token: string;
          status?: "invited" | "confirmed" | "checked_in" | "declined";
          plus_ones?: number;
          dietary_notes?: string;
          guest_notes?: string;
          label?: "none" | "vip" | "family" | "wedding_party" | "corporate" | "other";
          guest_source?: "manual" | "sheet_master" | "sheet_rsvp";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["guests"]["Insert"]>;
      };
      guest_audit_log: {
        Row: {
          id: string;
          guest_id: string | null;
          event_id: string;
          guest_name: string;
          action: string;
          details: string;
          changed_at: string;
        };
        Insert: {
          id?: string;
          guest_id?: string | null;
          event_id: string;
          guest_name?: string;
          action: string;
          details?: string;
          changed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["guest_audit_log"]["Insert"]>;
      };
      checkins: {
        Row: {
          id: string;
          guest_id: string;
          event_id: string;
          checkin_time: string;
        };
        Insert: {
          id?: string;
          guest_id: string;
          event_id: string;
          checkin_time?: string;
        };
        Update: Partial<Database["public"]["Tables"]["checkins"]["Insert"]>;
      };
    };
    Views: {
      document_analytics: {
        Row: {
          id: string;
          document_number: string;
          document_type: "proforma" | "invoice" | "receipt";
          status: "draft" | "sent" | "paid" | "cancelled";
          currency: "MZN" | "USD" | "ZAR";
          business_id: string;
          business_name: string;
          invoice_prefix: string;
          client_id: string | null;
          client_type: "individual" | "company";
          client_name: string;
          company_name: string;
          event_type:
            | "wedding"
            | "birthday"
            | "corporate"
            | "baby_shower"
            | "graduation"
            | "other"
            | null;
          event_name: string;
          event_date: string | null;
          event_location: string;
          subtotal: number;
          vat_amount: number;
          grand_total: number;
          include_vat: boolean;
          issue_date: string;
          expiry_date: string;
          pdf_generated_at: string | null;
          created_at: string;
          updated_at: string;
          fiscal_year: number;
          fiscal_month: number;
          fiscal_quarter: number;
          period_month: string;
        };
      };
    };
    Functions: {
      next_document_number: {
        Args: {
          p_business_id: string;
          p_document_type: "proforma" | "invoice" | "receipt";
        };
        Returns: string;
      };
      peek_document_number: {
        Args: {
          p_business_id: string;
          p_document_type: "proforma" | "invoice" | "receipt";
        };
        Returns: string;
      };
      lookup_event_checkin: {
        Args: { p_event_id: string; p_token: string };
        Returns: Json;
      };
      perform_event_checkin: {
        Args: { p_event_id: string; p_token: string };
        Returns: Json;
      };
      perform_event_rsvp: {
        Args: {
          p_event_id: string;
          p_token: string;
          p_attendance?: string;
          p_name?: string;
          p_email?: string;
          p_phone?: string;
          p_plus_ones?: number;
          p_dietary_notes?: string;
          p_guest_notes?: string;
        };
        Returns: Json;
      };
      check_api_rate_limit: {
        Args: {
          p_bucket_key: string;
          p_max_requests: number;
          p_window_seconds: number;
        };
        Returns: Json;
      };
    };
    Enums: {
      client_type: "individual" | "company";
      currency_code: "MZN" | "USD" | "ZAR";
      document_status: "draft" | "sent" | "paid" | "cancelled";
      document_type: "proforma" | "invoice" | "receipt";
      event_type:
        | "wedding"
        | "birthday"
        | "corporate"
        | "baby_shower"
        | "graduation"
        | "other";
      item_source: "catalog" | "manual";
      inquiry_status: "new" | "contacted" | "converted" | "archived";
      guest_status: "invited" | "confirmed" | "checked_in" | "declined";
      guest_label: "none" | "vip" | "family" | "wedding_party" | "corporate" | "other";
      guest_source: "manual" | "sheet_master" | "sheet_rsvp";
      sheets_sync_mode: "master" | "rsvp";
      payment_method:
        | "cash"
        | "bank_transfer"
        | "mpesa"
        | "emola"
        | "card"
        | "other";
      expense_category:
        | "production"
        | "suppliers"
        | "marketing"
        | "logistics"
        | "payroll"
        | "other";
      service_category:
        | "invitations"
        | "websites"
        | "assessoria"
        | "branding"
        | "experiences"
        | "event_packages"
        | "addons"
        | "coordination"
        | "media";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type DocumentAnalyticsRow =
  Database["public"]["Views"]["document_analytics"]["Row"];
