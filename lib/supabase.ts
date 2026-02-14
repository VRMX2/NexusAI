
import { createClient } from '@supabase/supabase-js';
import { Role, SubscriptionPlan } from '../types';

// Hardcoded production credentials provided by the user
const supabaseUrl = 'https://konrejxursvksyafsqtc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbnJlanh1cnN2a3N5YWZzcXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNzc5NDQsImV4cCI6MjA4NjY1Mzk0NH0.-yjN0oBDCZJHgKOqrKkTP8dnncmu5YwkZ6FyqALA8h4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Data access layer using the established client
export const db = {
  profiles: {
    async get(userId: string) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      
      // If profile doesn't exist, attempt to create it (fallback for missing triggers)
      if (error && error.code === 'PGRST116') {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{ 
              id: userId, 
              full_name: userData.user.user_metadata?.full_name || '',
              avatar_url: `https://picsum.photos/seed/${userId}/200`
            }])
            .select()
            .single();
          
          if (createError) {
            console.warn(
              "NexusAI RLS Warning: Could not auto-create profile in DB. \n" +
              "Fix: Run this in Supabase SQL Editor: \n" +
              "CREATE POLICY \"Users can insert their own profile\" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);"
            );
            // Fallback for UI continuity
            return { 
              id: userId, 
              full_name: userData.user.user_metadata?.full_name || 'New User', 
              avatar_url: `https://picsum.photos/seed/${userId}/200`,
              created_at: new Date().toISOString()
            } as any;
          }
          return newProfile;
        }
      }
      
      if (error && error.code !== 'PGRST116') {
        console.error("Profile fetch error:", error);
      }
      return data || null;
    },
    async update(userId: string, updates: any) {
      const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
      if (error) {
        console.error(
          "Profile update failed. \n" +
          "Fix: Run this in Supabase SQL Editor: \n" +
          "CREATE POLICY \"Users can update their own profile\" ON public.profiles FOR UPDATE USING (auth.uid() = id);"
        );
        throw error;
      }
    },
    async uploadAvatar(userId: string, file: File) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error(
          "Avatar upload failed. \n" +
          "Fix: Go to Storage > avatars > Policies and add an 'INSERT' policy for authenticated users."
        );
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return data.publicUrl;
    }
  },
  projects: {
    async list() {
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    async create(name: string) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");
      
      const { data, error } = await supabase
        .from('projects')
        .insert([{ name, user_id: user.id }])
        .select()
        .single();
      
      if (error) {
        console.error(
          "Project creation failed. \n" +
          "Fix: Run this in Supabase SQL Editor: \n" +
          "CREATE POLICY \"Users can insert their own projects\" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);"
        );
        throw error;
      }
      return data;
    },
    async delete(id: string) {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    }
  },
  messages: {
    async list(projectId: string) {
      const { data, error } = await supabase.from('messages').select('*').eq('project_id', projectId).order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    async add(projectId: string, role: Role, content: string) {
      const { data, error } = await supabase.from('messages').insert([{ project_id: projectId, role, content }]).select().single();
      if (error) {
        console.error(
          "Message creation failed. \n" +
          "Fix: Run this in Supabase SQL Editor: \n" +
          "CREATE POLICY \"Users can insert messages to their own projects\" ON public.messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid()));"
        );
        throw error;
      }
      return data;
    }
  },
  subscriptions: {
    async get() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase.from('subscriptions').select('*').eq('user_id', user.id).single();
      
      // If subscription missing, create default free plan
      if (error && error.code === 'PGRST116') {
        const { data: newSub, error: createError } = await supabase
          .from('subscriptions')
          .insert([{ user_id: user.id, plan: SubscriptionPlan.FREE, status: 'active' }])
          .select()
          .single();
        
        if (createError) {
          console.warn(
            "NexusAI RLS Warning: Could not auto-create subscription in DB. \n" +
            "Fix: Run this in Supabase SQL Editor: \n" +
            "CREATE POLICY \"Users can insert their own subscription\" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);"
          );
          // Fallback to local free plan to avoid breaking the dashboard
          return { 
            id: 'virtual-sub-id',
            user_id: user.id, 
            plan: SubscriptionPlan.FREE, 
            status: 'active',
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          } as any;
        }
        return newSub;
      }
      
      return data || null;
    },
    async upgrade() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");
      const { error } = await supabase.from('subscriptions').update({ plan: SubscriptionPlan.PRO }).eq('user_id', user.id);
      if (error) {
        console.error(
          "Upgrade failed. \n" +
          "Fix: Run this in Supabase SQL Editor: \n" +
          "CREATE POLICY \"Users can update their own subscription\" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);"
        );
        throw error;
      }
    }
  }
};
