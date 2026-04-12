import nodemailer from 'nodemailer';

let transporter;

const hasMailConfig = () =>
  Boolean(process.env.SMTP_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const smtpHost = process.env.SMTP_HOST;
  const isGmailHost = smtpHost?.includes('gmail.com');

  transporter = nodemailer.createTransport({
    service: isGmailHost ? 'gmail' : undefined,
    host: smtpHost,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  return transporter;
};

export const sendOtpEmail = async ({ to, name, otp }) => {
  if (!hasMailConfig()) {
    throw new Error('Email configuration is incomplete');
  }

  const mailer = getTransporter();

  await mailer.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
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

export const sendReminderEmail = async ({ to, name, medicineName, dosage, time, type = 'created' }) => {
  const mailer = getTransporter();
  const subject =
    type === 'due' ? `Medicine Reminder: ${medicineName}` : `Reminder Created: ${medicineName}`;
  const intro =
    type === 'due'
      ? `It's time to take your medicine.`
      : `Your medicine reminder has been created successfully.`;

  await mailer.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
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
  const mailer = getTransporter();

  await mailer.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
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
