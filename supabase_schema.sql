-- ============================================
-- VILLANCA PET ADOPTION SYSTEM - SUPABASE SCHEMA
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgjwt";

-- ============================================
-- USERS TABLE (PUBLIC)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  fullname VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'adopter' CHECK (role IN ('adopter', 'staff', 'admin')),
  phone_number VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(10),
  profile_picture_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email and role for faster queries
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- ============================================
-- PETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL CHECK (category IN ('dog', 'cat', 'bird', 'rabbit', 'hamster', 'other')),
  breed VARCHAR(255),
  age INTEGER,
  age_unit VARCHAR(20) DEFAULT 'months' CHECK (age_unit IN ('days', 'months', 'years')),
  gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'unknown')),
  size VARCHAR(50) CHECK (size IN ('small', 'medium', 'large', 'extra_large')),
  color VARCHAR(100),
  description TEXT,
  health_status TEXT,
  vaccination_status BOOLEAN DEFAULT FALSE,
  neutered_spayed BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Reserved', 'Adopted')),
  image_url TEXT,
  intake_date TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for pet queries
CREATE INDEX IF NOT EXISTS idx_pets_category ON public.pets(category);
CREATE INDEX IF NOT EXISTS idx_pets_status ON public.pets(status);
CREATE INDEX IF NOT EXISTS idx_pets_created_by ON public.pets(created_by);
CREATE INDEX IF NOT EXISTS idx_pets_created_at ON public.pets(created_at);

-- ============================================
-- ADOPTION APPLICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.adoption_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Declined')),
  decline_reason TEXT,
  
  -- Application form data
  living_situation VARCHAR(100),
  home_type VARCHAR(100) CHECK (home_type IN ('apartment', 'house', 'farm', 'condo', 'other')),
  rent_or_own VARCHAR(50) CHECK (rent_or_own IN ('rent', 'own')),
  landlord_allows_pets BOOLEAN,
  household_members INTEGER,
  children_ages TEXT,
  other_pets_description TEXT,
  reason_for_adoption TEXT,
  daily_schedule TEXT,
  veterinary_reference TEXT,
  personal_reference TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for application queries
CREATE INDEX IF NOT EXISTS idx_adoption_applications_user_id ON public.adoption_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_adoption_applications_pet_id ON public.adoption_applications(pet_id);
CREATE INDEX IF NOT EXISTS idx_adoption_applications_status ON public.adoption_applications(status);
CREATE INDEX IF NOT EXISTS idx_adoption_applications_created_at ON public.adoption_applications(created_at);

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_one_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_two_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for conversation queries
CREATE INDEX IF NOT EXISTS idx_conversations_user_one ON public.conversations(user_one_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_two ON public.conversations(user_two_id);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for message queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON public.messages(read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- ============================================
-- SOUND ANALYSIS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.sound_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  sound_url TEXT NOT NULL,
  analysis JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for sound analysis queries
CREATE INDEX IF NOT EXISTS idx_sound_analysis_pet_id ON public.sound_analysis(pet_id);
CREATE INDEX IF NOT EXISTS idx_sound_analysis_created_at ON public.sound_analysis(created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoption_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sound_analysis ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Anyone can view public user profiles
CREATE POLICY "Users can view all profiles" ON public.users
  FOR SELECT USING (TRUE);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Only admins and staff can view/manage user roles
CREATE POLICY "Admins can update user roles" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- ============================================
-- PETS TABLE POLICIES
-- ============================================

-- Anyone can view all pets
CREATE POLICY "Anyone can view pets" ON public.pets
  FOR SELECT USING (TRUE);

-- Only staff and admins can insert/update/delete pets
CREATE POLICY "Staff can manage pets" ON public.pets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Staff can update pets" ON public.pets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Staff can delete pets" ON public.pets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- ============================================
-- ADOPTION APPLICATIONS TABLE POLICIES
-- ============================================

-- Users can view their own applications
CREATE POLICY "Users can view own applications" ON public.adoption_applications
  FOR SELECT USING (auth.uid() = user_id);

-- Staff and admins can view all applications
CREATE POLICY "Staff can view all applications" ON public.adoption_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Users can insert their own applications
CREATE POLICY "Users can create own applications" ON public.adoption_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending applications
CREATE POLICY "Users can update own pending applications" ON public.adoption_applications
  FOR UPDATE USING (
    auth.uid() = user_id AND status = 'Pending'
  )
  WITH CHECK (
    auth.uid() = user_id AND status = 'Pending'
  );

-- Staff and admins can update applications
CREATE POLICY "Staff can update applications" ON public.adoption_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- ============================================
-- CONVERSATIONS TABLE POLICIES
-- ============================================

-- Users can view conversations they are part of
CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT USING (
    auth.uid() = user_one_id OR auth.uid() = user_two_id
  );

-- Users can create conversations
CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (
    auth.uid() = user_one_id OR auth.uid() = user_two_id
  );

-- ============================================
-- MESSAGES TABLE POLICIES
-- ============================================

-- Users can view messages in conversations they are part of
CREATE POLICY "Users can view own conversation messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id
      AND (user_one_id = auth.uid() OR user_two_id = auth.uid())
    )
  );

-- Users can insert messages in conversations they are part of
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id
      AND (user_one_id = auth.uid() OR user_two_id = auth.uid())
    )
  );

-- Users can update their own messages (mark as read by receiver)
CREATE POLICY "Users can update message read status" ON public.messages
  FOR UPDATE USING (
    auth.uid() = receiver_id
  )
  WITH CHECK (
    auth.uid() = receiver_id
  );

-- ============================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Authenticated users can insert notifications for any user
CREATE POLICY "Authenticated users can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- SOUND ANALYSIS TABLE POLICIES
-- ============================================

-- Anyone can view sound analyses
CREATE POLICY "Anyone can view sound analysis" ON public.sound_analysis
  FOR SELECT USING (TRUE);

-- Only authenticated users can insert sound analyses
CREATE POLICY "Authenticated users can create sound analysis" ON public.sound_analysis
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- AUDIT FUNCTIONS
-- ============================================

-- Note: For syncing fullname from auth.users metadata, use the application layer
-- This is safer than creating triggers on system auth tables

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_adoption_applications_updated_at BEFORE UPDATE ON public.adoption_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Create storage buckets (run these separately)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('pet-images', 'pet-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('animal-sounds', 'animal-sounds', true);

-- Pet images storage policies
CREATE POLICY "Anyone can view pet images" ON storage.objects
  FOR SELECT USING (bucket_id = 'pet-images');

CREATE POLICY "Staff can upload pet images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'pet-images' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Animal sounds storage policies
CREATE POLICY "Anyone can view animal sounds" ON storage.objects
  FOR SELECT USING (bucket_id = 'animal-sounds');

CREATE POLICY "Authenticated users can upload sounds" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'animal-sounds' AND auth.uid() IS NOT NULL
  );

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_adoption_applications_user_pet ON public.adoption_applications(user_id, pet_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at);
