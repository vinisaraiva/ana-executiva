/**
 * Job queue management utilities
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { Job } from "../types/sales.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

/**
 * Lock the next available job for processing
 * Uses optimistic locking to prevent race conditions
 */
export async function lockNextJob(workerId: string): Promise<Job | null> {
  const { data: jobs, error: fetchError } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('status', 'queued')
    .lte('available_at', new Date().toISOString())
    .lt('attempts', 3)
    .order('created_at', { ascending: true })
    .limit(1);

  if (fetchError || !jobs || jobs.length === 0) {
    return null;
  }

  const job = jobs[0];

  const { data: lockedJob, error: lockError } = await supabaseAdmin
    .from('jobs')
    .update({
      status: 'processing',
      locked_at: new Date().toISOString(),
      locked_by: workerId,
      attempts: job.attempts + 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', job.id)
    .eq('status', 'queued')
    .select()
    .single();

  if (lockError || !lockedJob) {
    console.log(`[Worker ${workerId}] Failed to lock job ${job.id}, already taken`);
    return null;
  }

  return lockedJob as Job;
}

/**
 * Mark job as completed
 */
export async function markJobDone(jobId: string): Promise<void> {
  await supabaseAdmin
    .from('jobs')
    .update({ 
      status: 'done', 
      updated_at: new Date().toISOString(),
      locked_at: null,
      locked_by: null
    })
    .eq('id', jobId);
}

/**
 * Mark job as failed
 */
export async function markJobFailed(jobId: string, errorMessage: string): Promise<void> {
  await supabaseAdmin
    .from('jobs')
    .update({
      status: 'failed',
      last_error: errorMessage,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId);
}

/**
 * Get Supabase admin client for database operations
 */
export function getSupabaseAdmin() {
  return supabaseAdmin;
}
