import { createClient } from '@supabase/supabase-js';
import { Database } from './db-types';

// For development, we're using default values - you'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client for browser usage (with anonymous key)
export const supabase = createClient<Database>(
  supabaseUrl, 
  supabaseAnonKey
);

// Admin client for server-side operations (with service role key)
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

export async function getServices() {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('price_cents', { ascending: true });
    
    if (error) {
      // If the table doesn't exist yet, just return an empty array
      if (error.code === '42P01') { // PostgreSQL code for undefined_table
        console.log("Services table does not exist yet - returning empty array");
        return [];
      }
      throw error;
    }
    
    return data;
  } catch (err) {
    console.error("Error in getServices:", err);
    return [];
  }
}

export async function getServiceById(id: string) {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // If the table doesn't exist yet or the service is not found
      if (error.code === '42P01' || error.code === 'PGRST116') {
        console.log(`Services table does not exist yet or service ${id} not found`);
        throw new Error(`Service not found: ${id}`);
      }
      throw error;
    }
    
    return data;
  } catch (err) {
    console.error(`Error in getServiceById(${id}):`, err);
    throw err; // Re-throw so calling code can handle not-found
  }
}

export async function createService(service: Omit<Database['public']['Tables']['services']['Insert'], 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('services')
    .insert([{
      ...service,
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateService(id: string, service: Partial<Omit<Database['public']['Tables']['services']['Update'], 'id' | 'created_at'>>) {
  const { data, error } = await supabase
    .from('services')
    .update({
      ...service,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteService(id: string) {
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function getBookings(
  options: { status?: string; startDate?: Date; endDate?: Date } = {}
) {
  try {
    let query = supabase
      .from('bookings')
      .select('*, service:services(*)')
      .order('start_time', { ascending: true });

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.startDate) {
      query = query.gte('start_time', options.startDate.toISOString());
    }

    if (options.endDate) {
      query = query.lte('start_time', options.endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      // If the table doesn't exist yet, just return an empty array
      if (error.code === '42P01') { // PostgreSQL code for undefined_table
        console.log("Bookings table does not exist yet - returning empty array");
        return [];
      }
      throw error;
    }
    
    return data;
  } catch (err) {
    console.error("Error in getBookings:", err);
    return [];
  }
}

export async function getBookingById(id: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, service:services(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createBooking(booking: Omit<Database['public']['Tables']['bookings']['Insert'], 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('bookings')
    .insert([{
      ...booking,
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBooking(id: string, booking: Partial<Omit<Database['public']['Tables']['bookings']['Update'], 'id' | 'created_at'>>) {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      ...booking,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBooking(id: string) {
  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function getBookingsByTimeRange(start: Date, end: Date) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .or(`start_time.gte.${start.toISOString()},end_time.lte.${end.toISOString()}`)
      .or(`start_time.lt.${start.toISOString()},end_time.gt.${start.toISOString()}`)
      .not('status', 'eq', 'cancelled');

    if (error) {
      // If the table doesn't exist yet, just return an empty array
      if (error.code === '42P01') {
        console.log("Bookings table does not exist yet - returning empty array");
        return [];
      }
      throw error;
    }
    
    return data;
  } catch (err) {
    console.error("Error in getBookingsByTimeRange:", err);
    return [];
  }
}
