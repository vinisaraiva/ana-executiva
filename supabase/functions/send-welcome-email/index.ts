/**
 * @fileoverview Edge Function de Email de Boas-vindas - DrGeFin
 * 
 * Envia um email de boas-vindas para novos usuários com o número
 * do WhatsApp do GeFin e um botão para iniciar conversa.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Número do WhatsApp do GeFin
const GEFIN_WHATSAPP = "+55 73 9184-0832";
const GEFIN_WHATSAPP_LINK = "https://wa.me/5573991840832?text=Olá%20GeFin!%20Acabei%20de%20me%20cadastrar%20e%20quero%20começar%20a%20usar.";

interface WelcomeEmailRequest {
  email: string;
  firstName?: string;
}

const handler = async (req: Request): Promise<Response> => {
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

    const { email, firstName }: WelcomeEmailRequest = await req.json();
    const name = firstName || "Usuário";

    console.log("Sending welcome email to:", email);

    const emailResponse = await resend.emails.send({
      from: "GeFin <noreply@gefin.app.br>",
      to: [email],
      subject: "Bem-vindo ao GeFin! 🎉 Aqui está nosso WhatsApp",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #16a34a; margin: 0; font-size: 28px;">Olá, ${name}! 👋</h1>
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
            Seja muito bem-vindo(a) ao <strong>GeFin</strong> - seu Gestor Financeiro com Inteligência Artificial!
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Para facilitar sua experiência, você pode conversar diretamente com nosso assistente de IA pelo WhatsApp. É rápido, prático e está sempre disponível para ajudar!
          </p>
          
          <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #16a34a; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0;">
            <p style="color: #166534; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">
              Nosso WhatsApp
            </p>
            <p style="font-size: 28px; font-weight: bold; color: #16a34a; margin: 0;">
              📱 ${GEFIN_WHATSAPP}
            </p>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${GEFIN_WHATSAPP_LINK}" 
               style="display: inline-block; background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 14px rgba(37, 211, 102, 0.4);">
              💬 Conversar no WhatsApp
            </a>
          </div>
          
          <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin: 24px 0;">
            <p style="color: #6b7280; font-size: 14px; margin: 0; line-height: 1.6;">
              💡 <strong>Dica:</strong> Ao enviar a primeira mensagem pelo WhatsApp, você inicia a conversa e pode começar a usar o GeFin imediatamente!
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
          
          <div style="text-align: center;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 8px 0;">
              Até logo,
            </p>
            <p style="color: #16a34a; font-size: 18px; font-weight: bold; margin: 0;">
              Equipe GeFin
            </p>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 32px;">
            Este email foi enviado automaticamente. Por favor, não responda.
          </p>
        </div>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Erro ao enviar email de boas-vindas:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
