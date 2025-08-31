export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          primary_color: string;
          secondary_color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          name: string;
          description: string;
          company_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          company_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          company_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: string;
          username: string | null;
          team_id: string | null;
          company_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role?: string;
          username?: string | null;
          team_id?: string | null;
          company_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: string;
          username?: string | null;
          team_id?: string | null;
          company_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          role: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          role?: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          role?: string;
          joined_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string;
          start_date: string;
          end_date: string;
          status: string;
          progress: number;
          team_id: string | null;
          company_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          start_date: string;
          end_date: string;
          status?: string;
          progress?: number;
          team_id?: string | null;
          company_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          start_date?: string;
          end_date?: string;
          status?: string;
          progress?: number;
          team_id?: string | null;
          company_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      phases: {
        Row: {
          id: string;
          name: string;
          description: string;
          total_target: number;
          start_date: string;
          end_date: string;
          status: string;
          progress: number;
          project_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          total_target?: number;
          start_date: string;
          end_date: string;
          status?: string;
          progress?: number;
          project_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          total_target?: number;
          start_date?: string;
          end_date?: string;
          status?: string;
          progress?: number;
          project_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string;
          status: string;
          priority: string;
          assigned_to_team_id: string | null;
          assigned_to_user_id: string | null;
          start_date: string;
          end_date: string;
          progress: number;
          phase_id: string;
          project_id: string;
          total_target: number;
          planned_effort_hours: number;
          actual_effort_hours: number;
          risk_level: string;
          completion_rate: number;
          time_spent: number;
          is_overdue: boolean;
          last_activity: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          status?: string;
          priority?: string;
          assigned_to_team_id?: string | null;
          assigned_to_user_id?: string | null;
          start_date: string;
          end_date: string;
          progress?: number;
          phase_id: string;
          project_id: string;
          total_target?: number;
          planned_effort_hours?: number;
          actual_effort_hours?: number;
          risk_level?: string;
          completion_rate?: number;
          time_spent?: number;
          is_overdue?: boolean;
          last_activity?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          status?: string;
          priority?: string;
          assigned_to_team_id?: string | null;
          assigned_to_user_id?: string | null;
          start_date?: string;
          end_date?: string;
          progress?: number;
          phase_id?: string;
          project_id?: string;
          total_target?: number;
          planned_effort_hours?: number;
          actual_effort_hours?: number;
          risk_level?: string;
          completion_rate?: number;
          time_spent?: number;
          is_overdue?: boolean;
          last_activity?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      daily_achievements: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          date: string;
          value: number;
          check_in_time: string | null;
          check_in_location: any;
          check_out_time: string | null;
          check_out_location: any;
          work_hours: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          date: string;
          value?: number;
          check_in_time?: string | null;
          check_in_location?: any;
          check_out_time?: string | null;
          check_out_location?: any;
          work_hours?: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string;
          date?: string;
          value?: number;
          check_in_time?: string | null;
          check_in_location?: any;
          check_out_time?: string | null;
          check_out_location?: any;
          work_hours?: number;
          notes?: string | null;
          created_at?: string;
        };
      };
    };
  };
}