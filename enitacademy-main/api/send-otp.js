// api/send-otp.js
// Vercel Serverless Function — envía código OTP por email via Resend

const RESEND_API_KEY = "re_T8au6FLT_31VobBwNUGqiYx2N9ea2Qnqy";

// Guarda los códigos temporalmente en memoria (se resetea con cada deploy)
// Para producción real usarías Redis o Supabase, pero esto funciona bien
const otpStore = new Map();

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")   return res.status(405).json({ error: "Método no permitido" });

  const { email, action } = req.body || {};

  if (!email) return res.status(400).json({ error: "Email requerido" });

  // ── Verificar código ──────────────────────────────────────────────────────
  if (action === "verify") {
    const { code } = req.body;
    const entry = otpStore.get(email.toLowerCase());

    if (!entry) {
      return res.status(400).json({ error: "Código no encontrado o expirado." });
    }

    if (Date.now() > entry.expiry) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ error: "El código expiró. Solicita uno nuevo." });
    }

    if (entry.code !== code) {
      entry.intentos = (entry.intentos || 0) + 1;
      if (entry.intentos >= 5) {
        otpStore.delete(email.toLowerCase());
        return res.status(400).json({ error: "Demasiados intentos. Solicita un nuevo código." });
      }
      return res.status(400).json({ error: "Código incorrecto." });
    }

    // ✅ Código correcto
    otpStore.delete(email.toLowerCase());
    return res.status(200).json({ ok: true });
  }

  // ── Enviar código ─────────────────────────────────────────────────────────
  // Generar código de 6 dígitos
  const code   = String(Math.floor(100000 + Math.random() * 900000));
  const expiry = Date.now() + 10 * 60 * 1000; // 10 minutos

  otpStore.set(email.toLowerCase(), { code, expiry, intentos: 0 });

  // Enviar email via Resend
  const emailBody = {
    from:    "ENIT Academy <onboarding@resend.dev>",
    to:      [email],
    subject: "Tu código de verificación — ENIT Academy",
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#0d0d14;font-family:'Inter',sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d14;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#14141f;border-radius:16px;border:1px solid rgba(255,255,255,0.08);padding:40px 32px;text-align:center;">
                <tr>
                  <td>
                    <p style="font-size:1.1rem;font-weight:700;letter-spacing:0.06em;color:#ff4fa0;text-transform:uppercase;margin:0 0 24px;">ENIT Academy</p>
                    <div style="width:64px;height:64px;background:rgba(255,79,160,0.15);border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;">
                      <p style="font-size:1.8rem;margin:0;">✉️</p>
                    </div>
                    <h1 style="color:#f0f0f8;font-size:1.4rem;margin:0 0 8px;">Verifica tu cuenta</h1>
                    <p style="color:#888;font-size:0.9rem;line-height:1.6;margin:0 0 32px;">
                      Usa este código para confirmar tu cuenta en ENIT Academy.
                      Expira en <strong style="color:#f0f0f8;">10 minutos</strong>.
                    </p>
                    <div style="background:#0d0d14;border:1.5px solid rgba(255,79,160,0.3);border-radius:12px;padding:24px;margin:0 0 24px;">
                      <p style="font-size:2.8rem;font-weight:700;letter-spacing:12px;color:#ff4fa0;margin:0;font-family:monospace;">${code}</p>
                    </div>
                    <p style="color:#555;font-size:0.78rem;margin:0;">
                      Si no solicitaste esto, ignora este correo.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify(emailBody),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Resend error:", result);
      return res.status(500).json({ error: "No se pudo enviar el correo: " + (result.message || "error desconocido") });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error("Error enviando email:", err);
    return res.status(500).json({ error: "Error de conexión al enviar el correo." });
  }
}