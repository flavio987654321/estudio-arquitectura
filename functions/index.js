const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const nodemailer = require("nodemailer");

const escapeHtml = (value) => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

const getEnv = (key) => {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing env ${key}`);
  }
  return val;
};

const createTransporter = () => {
  const user = getEnv("GMAIL_USER");
  const pass = getEnv("GMAIL_APP_PASSWORD");
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass }
  });
};

exports.sendContactEmail = onCall(
  {
    cors: true,
    secrets: ["GMAIL_USER", "GMAIL_APP_PASSWORD", "CONTACT_TO"]
  },
  async (request) => {
    try {
      const data = request.data || {};
      const nombre = String(data.nombre || "").trim();
      const email = String(data.email || "").trim();
      const telefono = String(data.telefono || "").trim();
      const mensaje = String(data.mensaje || "").trim();
      const page = String(data.page || "").trim();
      const referrer = String(data.referrer || "").trim();
      const userAgent = String(data.userAgent || "").trim();
      const timestamp = String(data.timestamp || "").trim();

      if (!nombre || !email || !telefono) {
        throw new HttpsError("invalid-argument", "Faltan datos obligatorios.");
      }

      if (nombre.length > 120 || email.length > 254 || telefono.length > 40 || mensaje.length > 3000) {
        throw new HttpsError("invalid-argument", "Uno de los campos supera el límite permitido.");
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new HttpsError("invalid-argument", "El email no es válido.");
      }

      const user = getEnv("GMAIL_USER");
      const to = process.env.CONTACT_TO || user;

      const transporter = createTransporter();

      const dateObj = timestamp ? new Date(timestamp) : new Date();
      const fecha = new Intl.DateTimeFormat("es-AR", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: "America/Argentina/Buenos_Aires"
      }).format(dateObj);

      const subject = `Nuevo contacto: ${nombre} (${telefono})`;
      const text = [
        "Nuevo contacto desde la web",
        `Fecha: ${fecha}`,
        `Nombre: ${nombre}`,
        `Email: ${email}`,
        `Teléfono: ${telefono}`,
        mensaje ? `Mensaje: ${mensaje}` : "",
        page ? `Página: ${page}` : "",
        referrer ? `Referente: ${referrer}` : "",
        userAgent ? `Navegador: ${userAgent}` : ""
      ].filter(Boolean).join("\n");

      const html = `
        <div style="font-family:Arial,sans-serif; font-size:14px; color:#111;">
          <h2 style="margin:0 0 10px;">Nuevo contacto desde la web</h2>
          <p style="margin:0 0 16px; color:#555;">${escapeHtml(fecha)}</p>
          <table style="border-collapse:collapse; width:100%;">
            <tr><td style="padding:6px 0; width:140px;"><strong>Nombre</strong></td><td>${escapeHtml(nombre)}</td></tr>
            <tr><td style="padding:6px 0;"><strong>Email</strong></td><td>${escapeHtml(email)}</td></tr>
            <tr><td style="padding:6px 0;"><strong>Teléfono</strong></td><td>${escapeHtml(telefono)}</td></tr>
            ${mensaje ? `<tr><td style="padding:6px 0;"><strong>Mensaje</strong></td><td>${escapeHtml(mensaje)}</td></tr>` : ""}
            ${page ? `<tr><td style="padding:6px 0;"><strong>Página</strong></td><td>${escapeHtml(page)}</td></tr>` : ""}
            ${referrer ? `<tr><td style="padding:6px 0;"><strong>Referente</strong></td><td>${escapeHtml(referrer)}</td></tr>` : ""}
            ${userAgent ? `<tr><td style="padding:6px 0;"><strong>Navegador</strong></td><td>${escapeHtml(userAgent)}</td></tr>` : ""}
          </table>
        </div>
      `;

      await transporter.sendMail({
        from: `Olas Estudio <${user}>`,
        to,
        replyTo: email,
        subject,
        text,
        html
      });

      return { ok: true };
    } catch (err) {
      logger.error("Error sendContactEmail", err);
      if (err instanceof HttpsError) throw err;
      throw new HttpsError("internal", "No se pudo enviar el email.");
    }
  }
);
