import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const tenantId = formData.get("tenant_id") as string;
    const overlapAction = formData.get("overlap_action") as string || "check"; // check, replace, merge
    const columnMapping = formData.get("column_mapping") as string | null;
    const profileId = formData.get("profile_id") as string | null;

    if (!file || !tenantId) {
      return new Response(JSON.stringify({ error: "Missing file or tenant_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ✅ SECURITY: Validate user has access to the tenant (IDOR prevention)
    const { data: membership } = await supabase
      .from("tenant_memberships")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      console.warn(`[SECURITY] Access denied: User ${user.id} tried to upload to tenant ${tenantId}`);
      
      // Log security event to audit_logs
      await supabase.rpc('log_audit_event', {
        _action: 'access_denied',
        _severity: 'critical',
        _user_id: user.id,
        _user_email: user.email,
        _tenant_id: tenantId,
        _details: { function: 'upload-file', filename: file.name },
        _success: false,
        _error_message: 'User not member of tenant'
      });
      
      return new Response(JSON.stringify({ error: "Access denied to this tenant" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ✅ CHECK TENANT LIMITS & STATUS
    const { data: limitCheck, error: limitError } = await supabase.rpc('check_tenant_limits', {
      _tenant_id: tenantId,
      _limit_type: 'imports'
    });

    if (limitError) {
      console.error('Error checking tenant limits:', limitError);
    } else if (limitCheck && !limitCheck.allowed) {
      console.log(`[LIMITS] Upload blocked for tenant ${tenantId}: ${limitCheck.reason}`);
      return new Response(JSON.stringify({
        error: limitCheck.message,
        reason: limitCheck.reason,
        limit_info: {
          current: limitCheck.current,
          limit: limitCheck.limit
        }
      }), {
        status: 402, // Payment Required
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate file type
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ error: "Invalid file type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for overlapping active imports (only for check or replace actions)
    if (overlapAction === "check") {
      // Get existing active imports with detected dates
      const { data: existingRuns, error: checkError } = await supabase
        .from("import_runs")
        .select("id, original_filename, detected_start_date, detected_end_date, status")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .eq("status", "done")
        .not("detected_start_date", "is", null)
        .not("detected_end_date", "is", null);

      if (!checkError && existingRuns && existingRuns.length > 0) {
        // Get new file dates from form (parsed client-side)
        const newStartDate = formData.get("new_start_date") as string | null;
        const newEndDate = formData.get("new_end_date") as string | null;

        // Analyze overlap type for each existing import
        const analyzeOverlap = (existingStart: string, existingEnd: string, newStart: string | null, newEnd: string | null) => {
          if (!newStart || !newEnd) return { type: 'unknown', recommendation: null };
          
          const eStart = new Date(existingStart).getTime();
          const eEnd = new Date(existingEnd).getTime();
          const nStart = new Date(newStart).getTime();
          const nEnd = new Date(newEnd).getTime();
          
          // New file contains old file completely
          if (nStart <= eStart && nEnd >= eEnd) {
            return { type: 'new_contains_old', recommendation: 'replace' };
          }
          // Old file contains new file completely
          if (eStart <= nStart && eEnd >= nEnd) {
            return { type: 'old_contains_new', recommendation: 'skip' };
          }
          // Partial overlap
          if ((nStart <= eEnd && nEnd >= eStart)) {
            return { type: 'partial', recommendation: 'merge' };
          }
          // No overlap - complementary periods
          return { type: 'none', recommendation: 'merge' };
        };

        // Analyze each existing import
        const importsWithAnalysis = existingRuns.map(run => {
          const analysis = analyzeOverlap(
            run.detected_start_date!, 
            run.detected_end_date!, 
            newStartDate, 
            newEndDate
          );
          return {
            id: run.id,
            filename: run.original_filename,
            start_date: run.detected_start_date,
            end_date: run.detected_end_date,
            overlap_type: analysis.type,
            recommendation: analysis.recommendation
          };
        });

        // Determine overall recommendation
        const hasNewContainsOld = importsWithAnalysis.some(i => i.overlap_type === 'new_contains_old');
        const hasOldContainsNew = importsWithAnalysis.some(i => i.overlap_type === 'old_contains_new');
        const hasPartial = importsWithAnalysis.some(i => i.overlap_type === 'partial');
        const allComplementary = importsWithAnalysis.every(i => i.overlap_type === 'none');

        let overallRecommendation: 'replace' | 'merge' | 'skip' | null = null;
        if (hasNewContainsOld && !hasPartial) {
          overallRecommendation = 'replace';
        } else if (hasOldContainsNew) {
          overallRecommendation = 'skip';
        } else if (allComplementary) {
          overallRecommendation = 'merge';
        } else if (hasPartial) {
          overallRecommendation = 'merge'; // merge with dedup
        }

        // Return info about existing imports with analysis
        return new Response(JSON.stringify({ 
          overlap_check: true,
          existing_imports: importsWithAnalysis,
          new_period: newStartDate && newEndDate ? { start: newStartDate, end: newEndDate } : null,
          overall_recommendation: overallRecommendation
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // If action is replace, deactivate existing imports AND delete their data
    let deactivatedImportIds: string[] = [];
    if (overlapAction === "replace") {
      const importsToDeactivate = formData.get("imports_to_deactivate") as string;
      if (importsToDeactivate) {
        deactivatedImportIds = JSON.parse(importsToDeactivate) as string[];
        if (deactivatedImportIds.length > 0) {
          console.log(`Replacing ${deactivatedImportIds.length} imports:`, deactivatedImportIds);
          
          // Delete related data first (before deactivating the import)
          console.log(`Deleting sales_lines for replaced imports...`);
          const { error: salesDeleteError } = await supabase
            .from("sales_lines")
            .delete()
            .in("import_run_id", deactivatedImportIds);
          if (salesDeleteError) {
            console.error("Error deleting sales_lines:", salesDeleteError);
          }

          console.log(`Deleting run_facts for replaced imports...`);
          const { error: factsDeleteError } = await supabase
            .from("run_facts")
            .delete()
            .in("import_run_id", deactivatedImportIds);
          if (factsDeleteError) {
            console.error("Error deleting run_facts:", factsDeleteError);
          }

          console.log(`Deleting anomalies for replaced imports...`);
          const { error: anomaliesDeleteError } = await supabase
            .from("anomalies")
            .delete()
            .in("import_run_id", deactivatedImportIds);
          if (anomaliesDeleteError) {
            console.error("Error deleting anomalies:", anomaliesDeleteError);
          }

          // Now deactivate the imports
          await supabase
            .from("import_runs")
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .in("id", deactivatedImportIds);
          
          console.log(`Successfully replaced ${deactivatedImportIds.length} imports and their data`);
        }
      }
    }

    // Create import_run with audit metadata
    const uploadMetadata = {
      overlap_action: overlapAction,
      replaced_imports: deactivatedImportIds,
      uploaded_at: new Date().toISOString(),
      uploaded_by_user_id: user.id,
    };

    const { data: importRun, error: runError } = await supabase
      .from("import_runs")
      .insert({
        tenant_id: tenantId,
        created_by: user.id,
        original_filename: file.name,
        status: "queued",
        is_active: true,
        metadata: uploadMetadata,
      })
      .select()
      .single();

    if (runError) {
      console.error("Error creating import_run:", runError);
      return new Response(JSON.stringify({ error: "Failed to create import run" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload file to storage
    const ext = file.name.split(".").pop() || "xlsx";
    const filePath = `tenants/${tenantId}/runs/${importRun.id}/original.${ext}`;
    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("imports")
      .upload(filePath, fileBuffer, { contentType: file.type });

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      await supabase.from("import_runs").delete().eq("id", importRun.id);
      return new Response(JSON.stringify({ error: "Failed to upload file" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update import_run with file path
    await supabase
      .from("import_runs")
      .update({ file_path: filePath })
      .eq("id", importRun.id);

    // Create job for worker with merge_mode flag and optional column mapping
    const mergeMode = overlapAction === "merge";
    const jobPayload: Record<string, unknown> = {
      tenant_id: tenantId,
      import_run_id: importRun.id,
      file_path: filePath,
      merge_mode: mergeMode,
    };

    // Include column mapping if provided (from wizard or saved profile)
    if (columnMapping) {
      try {
        jobPayload.column_mapping = JSON.parse(columnMapping);
      } catch (e) {
        console.warn("Failed to parse column_mapping:", e);
      }
    }

    if (profileId) {
      jobPayload.profile_id = profileId;
    }

    const { error: jobError } = await supabase.from("jobs").insert({
      tenant_id: tenantId,
      type: "import_sales",
      payload: jobPayload,
    });

    if (jobError) {
      console.error("Error creating job:", jobError);
    }

    console.log(`Upload successful: ${filePath}, run: ${importRun.id}, merge_mode: ${mergeMode}`);

    // Log successful upload to audit_logs
    await supabase.rpc('log_audit_event', {
      _action: 'file_upload',
      _severity: 'info',
      _user_id: user.id,
      _user_email: user.email,
      _tenant_id: tenantId,
      _details: { 
        filename: file.name, 
        file_size: file.size,
        import_run_id: importRun.id,
        merge_mode: mergeMode
      },
      _success: true
    });

    return new Response(
      JSON.stringify({ import_run_id: importRun.id, file_path: filePath }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
