import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvoiceEmailRequest {
  customerEmail: string;
  customerName: string;
  invoiceNumber: string;
  invoiceHtml: string;
  totalAmount: string;
  fromTo: string;
  invoiceDate: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      customerEmail, 
      customerName, 
      invoiceNumber, 
      invoiceHtml,
      totalAmount,
      fromTo,
      invoiceDate
    }: InvoiceEmailRequest = await req.json();

    if (!customerEmail) {
      throw new Error("Customer email is required");
    }

    const emailResponse = await resend.emails.send({
      from: "BSH Taxi Services <onboarding@resend.dev>",
      to: [customerEmail],
      subject: `Invoice #${invoiceNumber} from BSH Taxi Services`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
              .email-container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .header { background-color: #1e3a5f; color: white; padding: 20px; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; }
              .content { padding: 30px; }
              .invoice-details { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
              .invoice-details p { margin: 5px 0; color: #333; }
              .amount { font-size: 28px; font-weight: bold; color: #1e3a5f; text-align: center; margin: 20px 0; }
              .footer { background-color: #3498db; color: white; padding: 15px; text-align: center; font-size: 12px; }
              .cta { text-align: center; margin: 20px 0; }
              .cta a { display: inline-block; background-color: #1e3a5f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="header">
                <h1>BSH TAXI SERVICES</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Invoice #${invoiceNumber}</p>
              </div>
              <div class="content">
                <p>Dear ${customerName},</p>
                <p>Thank you for choosing BSH Taxi Services. Please find your invoice details below:</p>
                
                <div class="invoice-details">
                  <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
                  <p><strong>Date:</strong> ${invoiceDate}</p>
                  <p><strong>Route:</strong> ${fromTo}</p>
                </div>
                
                <div class="amount">
                  Total: ₹${totalAmount}
                </div>
                
                <p style="text-align: center; color: #666;">The complete invoice is attached to this email.</p>
                
                <p style="margin-top: 30px;">If you have any questions about this invoice, please contact us at:</p>
                <p style="color: #1e3a5f;">📞 +91 8886803322, +91 9640241216</p>
                <p style="color: #1e3a5f;">🌐 www.bshtaxiservices.com</p>
              </div>
              <div class="footer">
                <p>Customers are requested to check their belongings before leaving the cab. The Travel Office/Car Owner/Driver is not responsible for the loss of any belongings</p>
                <p style="margin-top: 10px;">36-92-242-532/1, Palanati colony, Kancharapelam, Visakhapatnam, 530008</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Invoice email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invoice-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
