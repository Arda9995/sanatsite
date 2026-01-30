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
      artists: {
        Row: {
          id: string
          user_id: string | null
          name: string
          bio: string
          avatar_url: string | null
          website: string | null
          instagram: string | null
          slug: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          bio?: string
          avatar_url?: string | null
          website?: string | null
          instagram?: string | null
          slug: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          bio?: string
          avatar_url?: string | null
          website?: string | null
          instagram?: string | null
          slug?: string
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string
          created_at?: string
        }
      }
      artworks: {
        Row: {
          id: string
          artist_id: string
          category_id: string | null
          title: string
          description: string
          price: number
          base_currency: string
          image_url: string
          dimensions: string | null
          medium: string | null
          year: number | null
          orientation: string
          is_available: boolean
          is_deleted: boolean
          featured: boolean
          created_at: string
        }
        Insert: {
          id?: string
          artist_id: string
          category_id?: string | null
          title: string
          description?: string
          price: number
          base_currency?: string
          image_url: string
          dimensions?: string | null
          medium?: string | null
          year?: number | null
          orientation?: string
          is_available?: boolean
          is_deleted?: boolean
          featured?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          artist_id?: string
          category_id?: string | null
          title?: string
          description?: string
          price?: number
          base_currency?: string
          image_url?: string
          dimensions?: string | null
          medium?: string | null
          year?: number | null
          orientation?: string
          is_available?: boolean
          is_deleted?: boolean
          featured?: boolean
          created_at?: string
        }
      }
      cart_items: {
        Row: {
          id: string
          user_id: string
          artwork_id: string
          quantity: number
          size: string | null
          material: string | null
          frame: string | null
          price: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          artwork_id: string
          quantity?: number
          size?: string | null
          material?: string | null
          frame?: string | null
          price?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          artwork_id?: string
          quantity?: number
          size?: string | null
          material?: string | null
          frame?: string | null
          price?: number | null
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          total_amount: number
          currency: string | null
          status: string
          shipping_address: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_amount: number
          currency?: string | null
          status?: string
          shipping_address?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_amount?: number
          currency?: string | null
          status?: string
          shipping_address?: Json | null
          created_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          artwork_id: string
          price: number
          quantity: number
          size: string | null
          material: string | null
          frame: string | null
        }
        Insert: {
          id?: string
          order_id: string
          artwork_id: string
          price: number
          quantity?: number
          size?: string | null
          material?: string | null
          frame?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          artwork_id?: string
          price?: number
          quantity?: number
          size?: string | null
          material?: string | null
          frame?: string | null
        }
      }
      artwork_submissions: {
        Row: {
          id: string
          artist_id: string
          image_url: string
          title: string | null
          description: string | null
          status: string
          orientation: string
          created_at: string
        }
        Insert: {
          id?: string
          artist_id: string
          image_url: string
          title?: string | null
          description?: string | null
          status?: string
          orientation?: string
          created_at?: string
        }
        Update: {
          id?: string
          artist_id?: string
          image_url?: string
          title?: string | null
          description?: string | null
          status?: string
          orientation?: string
          created_at?: string
        }
      }
    }
  }
}

export type Artist = Database['public']['Tables']['artists']['Row']
export type Artwork = Database['public']['Tables']['artworks']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type CartItem = Database['public']['Tables']['cart_items']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
