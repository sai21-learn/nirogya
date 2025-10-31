import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type DoctorProfile = {
  specialization: string;
  consultation_fee: number;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  consultation_types: string[];
  bio?: string;
  experience_years?: number;
  qualifications?: string[];
};

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const { data: doctors, error } = await supabase
      .from('doctors')
      .select(`
        id,
        specialization,
        consultation_fee,
        address,
        consultation_types,
        bio,
        experience_years,
        qualifications,
        created_at,
        updated_at,
        profiles:user_id (full_name, avatar_url)
      `);

    if (error) throw error;
    
    return NextResponse.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doctors' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    specialization,
    consultationFee,
    address,
    consultationTypes = ['in-person'],
    bio,
    experienceYears,
    qualifications = [],
  } = await request.json();

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if doctor profile already exists
    const { data: existingDoctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingDoctor) {
      return NextResponse.json(
        { error: 'Doctor profile already exists' },
        { status: 400 }
      );
    }

    // Create doctor profile
    const { data: doctor, error } = await supabase
      .from('doctors')
      .insert([
        {
          user_id: user.id,
          specialization,
          consultation_fee: consultationFee,
          address,
          consultation_types: consultationTypes,
          bio,
          experience_years: experienceYears,
          qualifications,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(doctor);
  } catch (error) {
    console.error('Error creating doctor profile:', error);
    return NextResponse.json(
      { error: 'Failed to create doctor profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    id,
    specialization,
    consultationFee,
    address,
    consultationTypes,
    bio,
    experienceYears,
    qualifications,
  } = await request.json();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify the doctor profile belongs to the user
    const { data: existingDoctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existingDoctor) {
      return NextResponse.json(
        { error: 'Doctor profile not found or access denied' },
        { status: 404 }
      );
    }

    // Update doctor profile
    const { data: doctor, error } = await supabase
      .from('doctors')
      .update({
        specialization,
        consultation_fee: consultationFee,
        address,
        consultation_types: consultationTypes,
        bio,
        experience_years: experienceYears,
        qualifications,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(doctor);
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    return NextResponse.json(
      { error: 'Failed to update doctor profile' },
      { status: 500 }
    );
  }
}