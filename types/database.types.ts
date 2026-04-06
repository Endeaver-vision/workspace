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
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      workspaces: {
        Row: {
          id: string
          name: string
          slug: string | null
          icon: string | null
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug?: string | null
          icon?: string | null
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string | null
          icon?: string | null
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member' | 'guest'
          joined_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member' | 'guest'
          joined_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member' | 'guest'
          joined_at?: string
        }
      }
      pages: {
        Row: {
          id: string
          workspace_id: string
          parent_id: string | null
          title: string
          icon: string | null
          cover_image: string | null
          content: Json
          position: number | null
          is_archived: boolean
          is_published: boolean
          created_by: string | null
          created_at: string
          updated_at: string
          archived_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          parent_id?: string | null
          title?: string
          icon?: string | null
          cover_image?: string | null
          content?: Json
          position?: number | null
          is_archived?: boolean
          is_published?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          parent_id?: string | null
          title?: string
          icon?: string | null
          cover_image?: string | null
          content?: Json
          position?: number | null
          is_archived?: boolean
          is_published?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
      }
      comments: {
        Row: {
          id: string
          page_id: string
          block_id: string | null
          user_id: string
          content: string
          resolved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          page_id: string
          block_id?: string | null
          user_id: string
          content: string
          resolved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          page_id?: string
          block_id?: string | null
          user_id?: string
          content?: string
          resolved?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      attachments: {
        Row: {
          id: string
          page_id: string | null
          block_id: string | null
          file_name: string
          file_path: string
          file_size: number | null
          mime_type: string | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          page_id?: string | null
          block_id?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          page_id?: string | null
          block_id?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
      }
      templates: {
        Row: {
          id: string
          workspace_id: string
          name: string
          description: string | null
          type: 'page' | 'database' | 'database_row'
          content: Json
          icon: string | null
          cover_url: string | null
          is_public: boolean
          is_default: boolean
          category: string | null
          tags: string[]
          use_count: number
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          description?: string | null
          type: 'page' | 'database' | 'database_row'
          content?: Json
          icon?: string | null
          cover_url?: string | null
          is_public?: boolean
          is_default?: boolean
          category?: string | null
          tags?: string[]
          use_count?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          description?: string | null
          type?: 'page' | 'database' | 'database_row'
          content?: Json
          icon?: string | null
          cover_url?: string | null
          is_public?: boolean
          is_default?: boolean
          category?: string | null
          tags?: string[]
          use_count?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      template_buttons: {
        Row: {
          id: string
          page_id: string
          block_id: string
          template_id: string
          label: string
          style: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          page_id: string
          block_id: string
          template_id: string
          label?: string
          style?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          page_id?: string
          block_id?: string
          template_id?: string
          label?: string
          style?: Json
          created_at?: string
          updated_at?: string
        }
      }
      template_categories: {
        Row: {
          id: string
          workspace_id: string
          name: string
          description: string | null
          icon: string | null
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          description?: string | null
          icon?: string | null
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          description?: string | null
          icon?: string | null
          position?: number
          created_at?: string
        }
      }
      template_usage: {
        Row: {
          id: string
          template_id: string
          user_id: string | null
          page_id: string | null
          used_at: string
        }
        Insert: {
          id?: string
          template_id: string
          user_id?: string | null
          page_id?: string | null
          used_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          user_id?: string | null
          page_id?: string | null
          used_at?: string
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

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Workspace = Database['public']['Tables']['workspaces']['Row']
export type WorkspaceMember = Database['public']['Tables']['workspace_members']['Row']
export type Page = Database['public']['Tables']['pages']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type Attachment = Database['public']['Tables']['attachments']['Row']
export type Template = Database['public']['Tables']['templates']['Row']
export type TemplateButton = Database['public']['Tables']['template_buttons']['Row']
export type TemplateCategory = Database['public']['Tables']['template_categories']['Row']
export type TemplateUsage = Database['public']['Tables']['template_usage']['Row']

// Extended types with relations
export type PageWithChildren = Page & {
  children?: PageWithChildren[]
}

export type WorkspaceWithMembers = Workspace & {
  workspace_members: (WorkspaceMember & { profiles: Profile })[]
}
