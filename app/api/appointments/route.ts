import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const userType = searchParams.get('userType'); // 'patient' or 'doctor'
  
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let query = supabase
      .from('appointments')
      .select(`
        *,
        doctors:doctor_id (id, specialization, consultation_fee, address, consultation_types, bio, experience_years, qualifications, profiles:user_id (full_name, avatar_url)),
        patients:patient_id (id, profiles:user_id (full_name, avatar_url))
      `)
      .order('appointment_date', { ascending: true });

    // Filter based on user type
    if (userType === 'doctor') {
      query = query.eq('doctor_id', userId);
    } else {
      // Default to patient view if no type specified
      query = query.eq('patient_id', userId || user.id);
    }

    const { data: appointments, error } = await query;

    if (error) throw error;

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    doctorId,
    appointmentDate,
    consultationType,
    patientNotes,
    symptoms,
  } = await request.json();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if doctor exists
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('id, consultation_types')
      .eq('id', doctorId)
      .single();

    if (doctorError || !doctor) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Validate consultation type
    if (!doctor.consultation_types.includes(consultationType)) {
      return NextResponse.json(
        { error: 'Selected consultation type is not available for this doctor' },
        { status: 400 }
      );
    }

    // Check for existing appointments at the same time
    const { data: existingAppointment, error: existingError } = await supabase
      .from('appointments')
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', appointmentDate)
      .eq('status', 'confirmed')
      .single();

    if (existingAppointment) {
      return NextResponse.json(
        { error: 'This time slot is already booked. Please choose another time.' },
        { status: 409 }
      );
    }

    // Create new appointment
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert([
        {
          patient_id: user.id,
          doctor_id: doctorId,
          appointment_date: appointmentDate,
          status: 'pending',
          consultation_type: consultationType,
          patient_notes: patientNotes,
          symptoms,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // TODO: Send notification to doctor about new appointment

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { id, status } = await request.json();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Get the appointment with related user info
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        id,
        doctor_id,
        patient_id,
        status,
        date,
        time,
        doctors:doctor_id(user_id, full_name, email),
        patients:patient_id(user_id, full_name, email)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Check if the user is either the doctor or the patient
    const isDoctor = appointment.doctors?.user_id === user.id;
    const isPatient = appointment.patients?.user_id === user.id;

    if (!isDoctor && !isPatient) {
      return NextResponse.json(
        { error: 'You are not authorized to modify this appointment' },
        { status: 403 }
      );
    }

    // Only allow status changes to 'cancelled' for patients
    if (isPatient && status !== 'cancelled') {
      return NextResponse.json(
        { error: 'You can only cancel appointments' },
        { status: 403 }
      );
    }

    // Prevent modifying past appointments
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    if (appointmentDateTime < new Date()) {
      return NextResponse.json(
        { error: 'Cannot modify past appointments' },
        { status: 400 }
      );
    }

    // Update appointment status
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update({
        status,
        updated_at: new Date().toISOString(),
        cancelled_by: isPatient ? 'patient' : (isDoctor ? 'doctor' : null),
        cancellation_reason: isPatient ? 'Cancelled by patient' : 
                           (isDoctor && status === 'cancelled' ? 'Cancelled by doctor' : null)
      })
      .eq('id', id)
      .select(`
        *,
        doctors:doctor_id(full_name, email),
        patients:patient_id(full_name, email)
      `)
      .single();

    if (updateError) {
      console.error('Error updating appointment:', updateError);
      throw updateError;
    }

    // Send notification to the other party
    try {
      if (status === 'cancelled') {
        const notificationRecipient = isDoctor ? appointment.patients : appointment.doctors;
        const notificationType = isPatient ? 'patient_cancelled' : 'doctor_cancelled';
        
        await supabase.from('notifications').insert({
          user_id: isDoctor ? appointment.patient_id : appointment.doctor_id,
          type: notificationType,
          message: `Appointment on ${appointment.date} at ${appointment.time} has been ${status}`,
          related_entity: 'appointment',
          related_entity_id: id,
          metadata: {
            appointment_id: id,
            status,
            cancelled_by: isPatient ? 'patient' : 'doctor',
            original_date: appointment.date,
            original_time: appointment.time
          }
        });
      }
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update appointment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}