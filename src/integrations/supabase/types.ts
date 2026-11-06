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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      abandoned_checkouts: {
        Row: {
          course_id: string
          created_at: string
          email: string
          id: string
          price: number
          status: string
          user_id: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          email?: string
          id?: string
          price: number
          status?: string
          user_id?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          email?: string
          id?: string
          price?: number
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          record_id: string | null
          resource: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          record_id?: string | null
          resource: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          record_id?: string | null
          resource?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          approval_mode: string
          commission_base: string
          commission_currency: string
          commission_percent: number
          commission_type: string
          hold_suspended: boolean
          holding_days: number
          id: string
          influencer_enabled: boolean
          influencer_type: string
          influencer_value: number
          kyc_required: boolean
          logo_url: string
          maintenance_message: string
          maintenance_mode: boolean
          max_withdrawal: number
          max_withdrawals_per_month: number
          min_withdrawal: number
          payout_cycle: string
          ref_fixed_levels: Json
          ref_level1_percent: number
          ref_level2_percent: number
          ref_level3_percent: number
          ref_levels: Json | null
          referral_enabled: boolean
          repurchase_enabled: boolean
          self_purchase_block: boolean
          support_email: string
          support_phone: string
          tds_percent: number
          updated_at: string
          upi_id: string
          upi_payee_name: string
        }
        Insert: {
          approval_mode?: string
          commission_base?: string
          commission_currency?: string
          commission_percent?: number
          commission_type?: string
          hold_suspended?: boolean
          holding_days?: number
          id?: string
          influencer_enabled?: boolean
          influencer_type?: string
          influencer_value?: number
          kyc_required?: boolean
          logo_url?: string
          maintenance_message?: string
          maintenance_mode?: boolean
          max_withdrawal?: number
          max_withdrawals_per_month?: number
          min_withdrawal?: number
          payout_cycle?: string
          ref_fixed_levels?: Json
          ref_level1_percent?: number
          ref_level2_percent?: number
          ref_level3_percent?: number
          ref_levels?: Json | null
          referral_enabled?: boolean
          repurchase_enabled?: boolean
          self_purchase_block?: boolean
          support_email?: string
          support_phone?: string
          tds_percent?: number
          updated_at?: string
          upi_id?: string
          upi_payee_name?: string
        }
        Update: {
          approval_mode?: string
          commission_base?: string
          commission_currency?: string
          commission_percent?: number
          commission_type?: string
          hold_suspended?: boolean
          holding_days?: number
          id?: string
          influencer_enabled?: boolean
          influencer_type?: string
          influencer_value?: number
          kyc_required?: boolean
          logo_url?: string
          maintenance_message?: string
          maintenance_mode?: boolean
          max_withdrawal?: number
          max_withdrawals_per_month?: number
          min_withdrawal?: number
          payout_cycle?: string
          ref_fixed_levels?: Json
          ref_level1_percent?: number
          ref_level2_percent?: number
          ref_level3_percent?: number
          ref_levels?: Json | null
          referral_enabled?: boolean
          repurchase_enabled?: boolean
          self_purchase_block?: boolean
          support_email?: string
          support_phone?: string
          tds_percent?: number
          updated_at?: string
          upi_id?: string
          upi_payee_name?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          audience: string
          created_at: string
          ends_at: string | null
          id: string
          message: string
          starts_at: string | null
          status: string
          title: string
        }
        Insert: {
          audience?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          message: string
          starts_at?: string | null
          status?: string
          title: string
        }
        Update: {
          audience?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          message?: string
          starts_at?: string | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          active: boolean
          created_at: string
          id: string
          image_url: string
          link_url: string
          placement: string
          position: number
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string
          link_url?: string
          placement?: string
          position?: number
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string
          link_url?: string
          placement?: string
          position?: number
          title?: string
        }
        Relationships: []
      }
      bonus_entries: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason?: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          audience: string
          channel: string
          created_at: string
          id: string
          name: string
          notification_id: string | null
          scheduled_at: string | null
          show_popup: boolean
          status: string
          template_id: string | null
        }
        Insert: {
          audience?: string
          channel?: string
          created_at?: string
          id?: string
          name: string
          notification_id?: string | null
          scheduled_at?: string | null
          show_popup?: boolean
          status?: string
          template_id?: string | null
        }
        Update: {
          audience?: string
          channel?: string
          created_at?: string
          id?: string
          name?: string
          notification_id?: string | null
          scheduled_at?: string | null
          show_popup?: boolean
          status?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_no: string
          course_id: string
          created_at: string
          id: string
          issued_at: string
          status: string
          user_id: string
        }
        Insert: {
          certificate_no: string
          course_id: string
          created_at?: string
          id?: string
          issued_at?: string
          status?: string
          user_id: string
        }
        Update: {
          certificate_no?: string
          course_id?: string
          created_at?: string
          id?: string
          issued_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      class_sessions: {
        Row: {
          category_slug: string
          completion_state: string
          course_id: string | null
          created_at: string
          id: string
          jitsi_url: string
          kind: string
          module_id: string | null
          recording_url: string
          starts_at: string
          status: string
          title: string
          youtube_url: string
        }
        Insert: {
          category_slug?: string
          completion_state?: string
          course_id?: string | null
          created_at?: string
          id?: string
          jitsi_url?: string
          kind?: string
          module_id?: string | null
          recording_url?: string
          starts_at: string
          status?: string
          title: string
          youtube_url?: string
        }
        Update: {
          category_slug?: string
          completion_state?: string
          course_id?: string | null
          created_at?: string
          id?: string
          jitsi_url?: string
          kind?: string
          module_id?: string | null
          recording_url?: string
          starts_at?: string
          status?: string
          title?: string
          youtube_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_entries: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          level: number
          on_hold: boolean
          order_id: string
          release_at: string
          status: string
          tds_amount: number
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          level?: number
          on_hold?: boolean
          order_id: string
          release_at?: string
          status?: string
          tds_amount?: number
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          level?: number
          on_hold?: boolean
          order_id?: string
          release_at?: string
          status?: string
          tds_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_entries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          expires_at: string | null
          id: string
          kind: string
          max_uses: number | null
          min_order: number
          used_count: number
          value: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          kind: string
          max_uses?: number | null
          min_order?: number
          used_count?: number
          value: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          kind?: string
          max_uses?: number | null
          min_order?: number
          used_count?: number
          value?: number
        }
        Relationships: []
      }
      course_categories: {
        Row: {
          created_at: string
          icon_url: string
          id: string
          name: string
          position: number
          slug: string
        }
        Insert: {
          created_at?: string
          icon_url?: string
          id?: string
          name: string
          position?: number
          slug: string
        }
        Update: {
          created_at?: string
          icon_url?: string
          id?: string
          name?: string
          position?: number
          slug?: string
        }
        Relationships: []
      }
      course_lessons: {
        Row: {
          allow_download: boolean
          course_id: string
          created_at: string
          duration_minutes: number
          id: string
          is_preview: boolean
          module_id: string | null
          position: number
          resource_path: string
          source_class_id: string | null
          title: string
          video_url: string
        }
        Insert: {
          allow_download?: boolean
          course_id: string
          created_at?: string
          duration_minutes?: number
          id?: string
          is_preview?: boolean
          module_id?: string | null
          position?: number
          resource_path?: string
          source_class_id?: string | null
          title: string
          video_url?: string
        }
        Update: {
          allow_download?: boolean
          course_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          is_preview?: boolean
          module_id?: string | null
          position?: number
          resource_path?: string
          source_class_id?: string | null
          title?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lessons_source_class_id_fkey"
            columns: ["source_class_id"]
            isOneToOne: true
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          drip_days: number
          id: string
          position: number
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          drip_days?: number
          id?: string
          position?: number
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          drip_days?: number
          id?: string
          position?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_reviews: {
        Row: {
          comment: string
          course_id: string
          created_at: string
          id: string
          rating: number
          status: string
          user_id: string
        }
        Insert: {
          comment?: string
          course_id: string
          created_at?: string
          id?: string
          rating: number
          status?: string
          user_id?: string
        }
        Update: {
          comment?: string
          course_id?: string
          created_at?: string
          id?: string
          rating?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          access_days: number
          access_type: string
          category: string
          created_at: string
          description: string
          final_quiz_id: string | null
          id: string
          instructor: string
          objectives: string
          price: number
          sale_price: number | null
          status: string
          thumbnail_url: string
          title: string
          updated_at: string
        }
        Insert: {
          access_days?: number
          access_type?: string
          category?: string
          created_at?: string
          description?: string
          final_quiz_id?: string | null
          id?: string
          instructor?: string
          objectives?: string
          price?: number
          sale_price?: number | null
          status?: string
          thumbnail_url?: string
          title: string
          updated_at?: string
        }
        Update: {
          access_days?: number
          access_type?: string
          category?: string
          created_at?: string
          description?: string
          final_quiz_id?: string | null
          id?: string
          instructor?: string
          objectives?: string
          price?: number
          sale_price?: number | null
          status?: string
          thumbnail_url?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_final_quiz_id_fkey"
            columns: ["final_quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_bookings: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string
          preferred_slot: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone: string
          preferred_slot?: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string
          preferred_slot?: string
          status?: string
        }
        Relationships: []
      }
      ebooks: {
        Row: {
          cover_url: string
          created_at: string
          description: string
          id: string
          price: number
          resource_path: string
          status: string
          title: string
        }
        Insert: {
          cover_url?: string
          created_at?: string
          description?: string
          id?: string
          price?: number
          resource_path?: string
          status?: string
          title: string
        }
        Update: {
          cover_url?: string
          created_at?: string
          description?: string
          id?: string
          price?: number
          resource_path?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          course_id: string
          created_at: string
          id: string
          last_lesson: number
          progress: number
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          last_lesson?: number
          progress?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          last_lesson?: number
          progress?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      instructors: {
        Row: {
          bio: string
          created_at: string
          expertise: string
          id: string
          name: string
          photo_url: string
          status: string
        }
        Insert: {
          bio?: string
          created_at?: string
          expertise?: string
          id?: string
          name: string
          photo_url?: string
          status?: string
        }
        Update: {
          bio?: string
          created_at?: string
          expertise?: string
          id?: string
          name?: string
          photo_url?: string
          status?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          buyer_gstin: string
          buyer_name: string
          gst_amount: number
          gst_rate: number
          id: string
          invoice_no: string
          issued_at: string
          order_id: string
          status: string
          subtotal: number
          total: number
        }
        Insert: {
          buyer_gstin?: string
          buyer_name: string
          gst_amount: number
          gst_rate?: number
          id?: string
          invoice_no: string
          issued_at?: string
          order_id: string
          status?: string
          subtotal: number
          total: number
        }
        Update: {
          buyer_gstin?: string
          buyer_name?: string
          gst_amount?: number
          gst_rate?: number
          id?: string
          invoice_no?: string
          issued_at?: string
          order_id?: string
          status?: string
          subtotal?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          note: string
          phone: string
          source: string
          status: string
        }
        Insert: {
          created_at?: string
          email?: string
          id?: string
          name: string
          note?: string
          phone?: string
          source?: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          note?: string
          phone?: string
          source?: string
          status?: string
        }
        Relationships: []
      }
      lesson_completions: {
        Row: {
          course_id: string
          created_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_completions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_completions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_payments: {
        Row: {
          admin_note: string
          amount: number
          course_id: string
          created_at: string
          id: string
          order_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_path: string
          status: string
          user_id: string
          utr: string
        }
        Insert: {
          admin_note?: string
          amount: number
          course_id: string
          created_at?: string
          id?: string
          order_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_path: string
          status?: string
          user_id: string
          utr: string
        }
        Update: {
          admin_note?: string
          amount?: number
          course_id?: string
          created_at?: string
          id?: string
          order_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_path?: string
          status?: string
          user_id?: string
          utr?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_payments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          body: string
          channel: string
          created_at: string
          id: string
          name: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          body?: string
          channel: string
          created_at?: string
          id?: string
          name: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          id?: string
          name?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_campaigns: {
        Row: {
          audience: string
          channel: string
          created_at: string
          created_by: string
          id: string
          image_url: string
          message: string
          show_popup: boolean
          status: string
          title: string
        }
        Insert: {
          audience?: string
          channel?: string
          created_at?: string
          created_by?: string
          id?: string
          image_url?: string
          message: string
          show_popup?: boolean
          status?: string
          title: string
        }
        Update: {
          audience?: string
          channel?: string
          created_at?: string
          created_by?: string
          id?: string
          image_url?: string
          message?: string
          show_popup?: boolean
          status?: string
          title?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          course_id: string
          created_at: string
          id: string
          provider_reference: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          course_id: string
          created_at?: string
          id?: string
          provider_reference?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          course_id?: string
          created_at?: string
          id?: string
          provider_reference?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      payout_requests: {
        Row: {
          amount: number
          created_at: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string
          city: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          preferred_language: string
          referral_code: string | null
          state: string | null
          updated_at: string
          verification_status: string
        }
        Insert: {
          account_status?: string
          city?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          preferred_language?: string
          referral_code?: string | null
          state?: string | null
          updated_at?: string
          verification_status?: string
        }
        Update: {
          account_status?: string
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string
          referral_code?: string | null
          state?: string | null
          updated_at?: string
          verification_status?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean
          code: string
          coupon_id: string | null
          created_at: string
          description: string
          id: string
        }
        Insert: {
          active?: boolean
          code: string
          coupon_id?: string | null
          created_at?: string
          description?: string
          id?: string
        }
        Update: {
          active?: boolean
          code?: string
          coupon_id?: string | null
          created_at?: string
          description?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          course_id: string | null
          created_at: string
          id: string
          passed: boolean
          percent: number
          quiz_id: string
          score: number
          total: number
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          id?: string
          passed?: boolean
          percent?: number
          quiz_id: string
          score?: number
          total?: number
          user_id?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          id?: string
          passed?: boolean
          percent?: number
          quiz_id?: string
          score?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_option: string
          created_at: string
          id: string
          marks: number
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question: string
          quiz_id: string | null
          topic: string
        }
        Insert: {
          correct_option: string
          created_at?: string
          id?: string
          marks?: number
          option_a: string
          option_b: string
          option_c?: string
          option_d?: string
          question: string
          quiz_id?: string | null
          topic?: string
        }
        Update: {
          correct_option?: string
          created_at?: string
          id?: string
          marks?: number
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question?: string
          quiz_id?: string | null
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          course_id: string | null
          created_at: string
          id: string
          max_attempts: number
          negative_marks: number
          pass_percent: number
          status: string
          time_limit_minutes: number
          title: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          id?: string
          max_attempts?: number
          negative_marks?: number
          pass_percent?: number
          status?: string
          time_limit_minutes?: number
          title: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          id?: string
          max_attempts?: number
          negative_marks?: number
          pass_percent?: number
          status?: string
          time_limit_minutes?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      ranks: {
        Row: {
          bonus_amount: number
          created_at: string
          id: string
          min_sales: number
          name: string
          position: number
        }
        Insert: {
          bonus_amount?: number
          created_at?: string
          id?: string
          min_sales?: number
          name: string
          position?: number
        }
        Update: {
          bonus_amount?: number
          created_at?: string
          id?: string
          min_sales?: number
          name?: string
          position?: number
        }
        Relationships: []
      }
      referral_influencers: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_relationships: {
        Row: {
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      refund_requests: {
        Row: {
          amount: number
          created_at: string
          id: string
          order_id: string
          reason: string
          reviewed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          order_id: string
          reason?: string
          reviewed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          order_id?: string
          reason?: string
          reviewed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_pages: {
        Row: {
          id: string
          keywords: string
          meta_description: string
          meta_title: string
          path: string
          updated_at: string
        }
        Insert: {
          id?: string
          keywords?: string
          meta_description?: string
          meta_title?: string
          path: string
          updated_at?: string
        }
        Update: {
          id?: string
          keywords?: string
          meta_description?: string
          meta_title?: string
          path?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          created_at: string
          id: string
          message: string
          priority: string
          reply: string
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          priority?: string
          reply?: string
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          priority?: string
          reply?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          popup_seen_at: string | null
          read_at: string | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          popup_seen_at?: string | null
          read_at?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          popup_seen_at?: string | null
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "notification_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      user_panel_permissions: {
        Row: {
          action: string
          id: string
          section: string
          user_id: string
        }
        Insert: {
          action: string
          id?: string
          section: string
          user_id: string
        }
        Update: {
          action?: string
          id?: string
          section?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_panel_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      app_branding: { Args: never; Returns: string }
      delete_admin_course: { Args: { _course_id: string }; Returns: undefined }
      get_course_quiz: { Args: { _course_id: string }; Returns: Json }
      has_panel_permission: {
        Args: { _action: string; _section: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      my_wallet: { Args: never; Returns: Json }
      payment_upi: { Args: never; Returns: Json }
      release_commissions_for: { Args: { _user: string }; Returns: number }
      release_due_commissions: { Args: never; Returns: number }
      request_payout: { Args: { _amount: number }; Returns: string }
      review_manual_payment: {
        Args: { _approve: boolean; _id: string; _note?: string }
        Returns: undefined
      }
      set_panel_permissions: {
        Args: { _permissions: Json; _user_id: string }
        Returns: undefined
      }
      set_upi_settings: {
        Args: { _payee: string; _upi_id: string }
        Returns: undefined
      }
      submit_course_quiz: {
        Args: { _answers: Json; _course_id: string }
        Returns: Json
      }
      submit_manual_payment: {
        Args: { _course_id: string; _screenshot_path: string; _utr: string }
        Returns: string
      }
      valid_ref_levels: { Args: { _levels: Json }; Returns: boolean }
      verify_certificate: {
        Args: { _no: string }
        Returns: {
          certificate_no: string
          course_title: string
          issued_at: string
          status: string
          student_name: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user" | "instructor"
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
  public: {
    Enums: {
      app_role: ["admin", "user", "instructor"],
    },
  },
} as const
