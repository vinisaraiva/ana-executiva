/**
 * Process Job Edge Function - Entry Point
 * 
 * This is a modular edge function that processes background jobs,
 * primarily for importing sales data from Excel files.
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { lockNextJob, markJobDone } from "./lib/job-queue.ts";
import { processImportSalesJob } from "./lib/import-processor.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const workerId = crypto.randomUUID();
  console.log(`[Worker ${workerId}] Starting job processing...`);

  try {
    const job = await lockNextJob(workerId);
    
    if (!job) {
      console.log(`[Worker ${workerId}] No jobs available`);
      return new Response(JSON.stringify({ message: 'No jobs available' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[Worker ${workerId}] Processing job ${job.id} of type ${job.type}`);

    if (job.type === 'import_sales') {
      await processImportSalesJob(job, workerId);
    } else {
      throw new Error(`Unknown job type: ${job.type}`);
    }

    await markJobDone(job.id);

    console.log(`[Worker ${workerId}] Job ${job.id} completed successfully`);

    return new Response(JSON.stringify({ success: true, jobId: job.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    const error = err as Error;
    console.error(`[Worker ${workerId}] Error:`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
