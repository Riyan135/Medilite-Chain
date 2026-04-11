import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export const normalizePhoneNumber = (value) => {
  if (!value) return null;
  const trimmed = value.replace(/\s+/g, '');
  if (trimmed.startsWith('+')) return trimmed;
  if (trimmed.length === 10) return `+91${trimmed}`;
  return trimmed;
};

export const canSendSms = () => Boolean(client && fromPhone);

export const sendSms = async ({ to, body }) => {
  const normalizedTo = normalizePhoneNumber(to);

  if (!normalizedTo) {
    throw new Error('Recipient phone number is missing');
  }

  if (!canSendSms()) {
    console.log(`[SMS MOCK] ${normalizedTo}: ${body}`);
    return { sid: 'mock-sms' };
  }

  return client.messages.create({
    body,
    from: fromPhone,
    to: normalizedTo,
  });
};

export const canSendWhatsApp = () =>
  Boolean(client && (process.env.TWILIO_WHATSAPP_NUMBER || fromPhone));

export const sendWhatsApp = async ({ to, body }) => {
  const normalizedTo = normalizePhoneNumber(to);

  if (!normalizedTo) {
    throw new Error('Recipient WhatsApp number is missing');
  }

  const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER || fromPhone;

  if (!client || !fromWhatsApp) {
    console.log(`[WHATSAPP MOCK] whatsapp:${normalizedTo}: ${body}`);
    return { sid: 'mock-whatsapp' };
  }

  const prefixedFrom = fromWhatsApp.startsWith('whatsapp:') ? fromWhatsApp : `whatsapp:${fromWhatsApp}`;

  return client.messages.create({
    body,
    from: prefixedFrom,
    to: `whatsapp:${normalizedTo}`,
  });
};
