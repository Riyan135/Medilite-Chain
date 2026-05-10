import nodemailer from 'nodemailer';

let transporter;
let gmailFallbackTransporter;

const hasMailConfig = () =>
  Boolean(process.env.SMTP_HOST?.trim() && process.env.EMAIL_USER?.trim() && process.env.EMAIL_PASS?.trim());

const isGmailHost = () => Boolean(process.env.SMTP_HOST?.trim()?.includes('gmail.com'));

const buildTransportOptions = ({ host, port, secure }) => ({
  host,
  port,
  secure,
  family: 4,
  localAddress: '0.0.0.0',
  auth: {
    user: process.env.EMAIL_USER?.trim(),
    pass: process.env.EMAIL_PASS?.replace(/\s+/g, ''),
  },
  requireTLS: !secure,
  tls: {
    servername: host,
    rejectUnauthorized: false,
  },
});

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport(
      buildTransportOptions({
        host: process.env.SMTP_HOST?.trim(),
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
      })
    );
  }

  return transporter;
};

const getGmailFallbackTransporter = () => {
  if (!gmailFallbackTransporter) {
    gmailFallbackTransporter = nodemailer.createTransport(
      buildTransportOptions({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
      })
    );
  }

  return gmailFallbackTransporter;
};

const sendMailWithFallback = async (message) => {
  const primaryTransporter = getTransporter();

  try {
    return await primaryTransporter.sendMail(message);
  } catch (error) {
    const canRetryWithGmailFallback =
      isGmailHost() &&
      (error?.code === 'ECONNECTION' || error?.code === 'ESOCKET');

    if (!canRetryWithGmailFallback) {
      throw error;
    }

    console.warn(
      `Primary SMTP connection failed (${error.code}). Retrying Gmail over SSL on port 465.`
    );

    return getGmailFallbackTransporter().sendMail(message);
  }
};

export const sendOtpEmail = async ({ to, name, otp }) => {
  if (!hasMailConfig()) {
    throw new Error('Email configuration is incomplete');
  }

  await sendMailWithFallback({
    from: process.env.EMAIL_FROM?.trim() || process.env.EMAIL_USER?.trim(),
    to,
    subject: 'Your MediLite OTP',
    text: `Hi ${name}, your MediLite OTP is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1d4ed8;">MediLite Login OTP</h2>
        <p>Hi ${name},</p>
        <p>Use this OTP to continue to your portal:</p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0f172a; margin: 24px 0;">
          ${otp}
        </div>
        <p>This OTP expires in 10 minutes.</p>
      </div>
    `,
  });

  return { delivered: true, mode: 'smtp' };
};

export const sendDoctorIdEmail = async ({ to, name, doctorId }) => {
  if (!hasMailConfig()) {
    throw new Error('Email configuration is incomplete');
  }

  await sendMailWithFallback({
    from: process.env.EMAIL_FROM?.trim() || process.env.EMAIL_USER?.trim(),
    to,
    subject: 'Your MediLite Doctor ID',
    text: `Hi ${name}, your MediLite Doctor ID is ${doctorId}. Use it for future doctor portal login requests.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1d4ed8;">MediLite Doctor ID</h2>
        <p>Hi ${name},</p>
        <p>Your permanent Doctor ID has been generated successfully.</p>
        <div style="font-size: 28px; font-weight: 800; letter-spacing: 3px; color: #0f172a; margin: 24px 0; padding: 18px 20px; border-radius: 16px; background: #eff6ff; border: 1px solid #bfdbfe;">
          ${doctorId}
        </div>
        <p>Please keep this Doctor ID for future doctor portal login requests.</p>
      </div>
    `,
  });

  return { delivered: true, mode: 'smtp' };
};

export const sendReminderEmail = async ({ to, name, medicineName, dosage, time, type = 'created' }) => {
  const subject =
    type === 'due' ? `Medicine Reminder: ${medicineName}` : `Reminder Created: ${medicineName}`;
  const intro =
    type === 'due'
      ? `It's time to take your medicine.`
      : `Your medicine reminder has been created successfully.`;

  await sendMailWithFallback({
    from: process.env.EMAIL_FROM?.trim() || process.env.EMAIL_USER?.trim(),
    to,
    subject,
    text: `Hi ${name}, ${intro} Medicine: ${medicineName}, Dosage: ${dosage}, Time: ${time}.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1d4ed8; margin-bottom: 16px;">MediLite Medicine Reminder</h2>
        <p>Hi ${name},</p>
        <p>${intro}</p>
        <div style="margin: 24px 0; padding: 20px; border-radius: 16px; background: #eff6ff; border: 1px solid #bfdbfe;">
          <p style="margin: 0 0 8px;"><strong>Medicine:</strong> ${medicineName}</p>
          <p style="margin: 0 0 8px;"><strong>Dosage:</strong> ${dosage}</p>
          <p style="margin: 0;"><strong>Time:</strong> ${time}</p>
        </div>
        <p>Please follow your doctor's instructions.</p>
      </div>
    `,
  });
};

export const sendEmergencyBookingEmail = async ({ to, name, hospitalName }) => {
  await sendMailWithFallback({
    from: process.env.EMAIL_FROM?.trim() || process.env.EMAIL_USER?.trim(),
    to,
    subject: 'Ambulance Dispatch Confirmed',
    text: `Hi ${name}, your ambulance request has been confirmed. ${hospitalName} has been notified and the ambulance is on the way.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #dc2626; margin-bottom: 16px;">Emergency Ambulance Dispatch Confirmed</h2>
        <p>Hi ${name},</p>
        <p>Your emergency request has been confirmed successfully.</p>
        <div style="margin: 24px 0; padding: 20px; border-radius: 16px; background: #fef2f2; border: 1px solid #fecaca;">
          <p style="margin: 0 0 8px;"><strong>Hospital:</strong> ${hospitalName}</p>
          <p style="margin: 0;"><strong>Status:</strong> Ambulance dispatched and on the way</p>
        </div>
        <p>Please keep your phone nearby and be ready to share your location if needed.</p>
      </div>
    `,
  });
};

export const sendPrescriptionReadyEmail = async ({ to, patientName, doctorName, prescriptionUrl }) => {
  if (!hasMailConfig()) {
    throw new Error('Email configuration is incomplete');
  }

  await sendMailWithFallback({
    from: process.env.EMAIL_FROM?.trim() || process.env.EMAIL_USER?.trim(),
    to,
    subject: `Prescription received from Dr. ${doctorName || 'Doctor'}`,
    text: `Hi ${patientName || 'Patient'}, you have receive a prescription from Dr. ${doctorName || 'Doctor'}. click below given download button to save the prescription in pdf format: ${prescriptionUrl}`,
    html: `
      <div style="margin:0;background:#f1f5f9;padding:32px 16px;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:18px;border:1px solid #dbeafe;overflow:hidden;box-shadow:0 18px 40px rgba(15,23,42,0.10);">
          <div style="padding:24px 28px;border-bottom:4px solid #2563eb;">
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="height:44px;width:44px;border-radius:12px;background:#2563eb;color:white;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:20px;">M</div>
              <div>
                <h1 style="margin:0;font-size:22px;line-height:1.2;color:#0f172a;">MediLite Prescription</h1>
                <p style="margin:4px 0 0;color:#475569;font-size:13px;font-weight:600;">Digital prescription and treatment advice</p>
              </div>
            </div>
          </div>
          <div style="padding:28px;">
            <p style="margin:0 0 14px;font-size:16px;">Hi <strong>${patientName || 'Patient'}</strong>,</p>
            <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#334155;">
              you have receive a prescription from <strong>Dr. ${doctorName || 'Doctor'}</strong>. 
            </p>
            <div style="margin:22px 0;padding:18px;border-radius:14px;background:#eff6ff;border:1px solid #bfdbfe;">
              <p style="margin:0;font-size:14px;line-height:1.6;color:#1e3a8a;">
                click below given download button to save the prescription in pdf format
              </p>
            </div>
            <a href="${prescriptionUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:800;border-radius:12px;padding:14px 22px;font-size:14px;">
              Download Prescription
            </a>
            <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#64748b;">
              If the button does not work, copy and open this link:<br />
              <span style="color:#2563eb;word-break:break-all;">${prescriptionUrl}</span>
            </p>
          </div>
        </div>
      </div>
    `,
  });

  return { delivered: true, mode: 'smtp' };
};
