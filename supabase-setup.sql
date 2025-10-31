-- Supabase Database Setup for Nirogya
-- Run these SQL commands in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (this will be automatically created by Supabase Auth, but we can add additional fields)
-- Note: Supabase Auth automatically creates an auth.users table
-- We'll create a profiles table to store additional user information if needed

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_at ON files(uploaded_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles table
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for files table
CREATE POLICY "Users can view own files" ON files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own files" ON files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own files" ON files
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own files" ON files
  FOR DELETE USING (auth.uid() = user_id);

-- Create a function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically create a profile when a user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can upload their own files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create report_summaries table for AI-generated summaries
CREATE TABLE IF NOT EXISTS report_summaries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  report_id UUID REFERENCES files(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  summary_text TEXT,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_report_summaries_report_id ON report_summaries(report_id);
CREATE INDEX IF NOT EXISTS idx_report_summaries_user_id ON report_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_report_summaries_status ON report_summaries(processing_status);

-- Enable Row Level Security (RLS)
ALTER TABLE report_summaries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for report_summaries table
CREATE POLICY "Users can view own report summaries" ON report_summaries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own report summaries" ON report_summaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own report summaries" ON report_summaries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own report summaries" ON report_summaries
  FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON public.report_summaries TO anon, authenticated;

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  specialization TEXT NOT NULL,
  consultation_fee NUMERIC(10, 2) DEFAULT 0,
  address JSONB NOT NULL,
  consultation_types TEXT[] DEFAULT ARRAY['in-person']::TEXT[],
  bio TEXT,
  experience_years INTEGER,
  qualifications TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  consultation_type TEXT NOT NULL CHECK (consultation_type IN ('in-person', 'video')),
  patient_notes TEXT,
  symptoms TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);

-- Enable RLS for new tables
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- RLS policies for doctors table
CREATE POLICY "Users can view all doctors" ON doctors
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own doctor profile" ON doctors
  FOR ALL USING (auth.uid() = user_id);

-- RLS policies for appointments table
CREATE POLICY "Patients can view own appointments" ON appointments
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view their appointments" ON appointments
  FOR SELECT USING (EXISTS (SELECT 1 FROM doctors WHERE doctors.id = appointments.doctor_id AND doctors.user_id = auth.uid()));

CREATE POLICY "Patients can create appointments" ON appointments
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Doctors can update appointment status" ON appointments
  FOR UPDATE USING (EXISTS (SELECT 1 FROM doctors WHERE doctors.id = appointments.doctor_id AND doctors.user_id = auth.uid()));

-- Grant necessary permissions
GRANT ALL ON public.doctors TO anon, authenticated;
GRANT ALL ON public.appointments TO anon, authenticated;
