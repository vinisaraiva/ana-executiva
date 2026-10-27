import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  tenant_id: string;
  subject: string;
  message: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { tenant_id, subject, message }: NotificationRequest = await req.json();

    console.log("Sending notification to tenant:", tenant_id);
    console.log("Subject:", subject);

    // Get tenant info
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("name")
      .eq("id", tenant_id)
      .single();

    if (tenantError) {
      console.error("Error fetching tenant:", tenantError);
      throw new Error("Tenant not found");
    }

    // Get owners and admins of the tenant
    const { data: memberships, error: membershipsError } = await supabase
      .from("tenant_memberships")
      .select("user_id, role")
      .eq("tenant_id", tenant_id)
      .in("role", ["owner", "admin"]);

    if (membershipsError) {
      console.error("Error fetching memberships:", membershipsError);
      throw new Error("Failed to fetch tenant members");
    }

    if (!memberships || memberships.length === 0) {
      console.log("No admins found for tenant");
      return new Response(
        JSON.stringify({ error: "No admins found for this tenant" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user emails from auth.users
    const userIds = memberships.map((m) => m.user_id);
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw new Error("Failed to fetch user emails");
    }

    const emails = users.users
      .filter((u) => userIds.includes(u.id) && u.email)
      .map((u) => u.email!);

    if (emails.length === 0) {
      console.log("No valid emails found");
      return new Response(
        JSON.stringify({ error: "No valid email addresses found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Sending email to:", emails);

    // Format the message with HTML
    const htmlMessage = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; margin-bottom: 20px;">${subject}</h2>
        <div style="color: #555; line-height: 1.6; white-space: pre-wrap;">${message}</div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #888; font-size: 12px;">
          Esta mensagem foi enviada para ${tenant.name} pela administração da plataforma.
        </p>
      </div>
    `;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "GeFin <noreply@gefin.app.br>",
      to: emails,
      subject: subject,
      html: htmlMessage,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, sent_to: emails.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-admin-notification:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
