const twilio = require('twilio');
const config = require('../config');

/* ─── Twilio client ────────────────────────────────────────────────────── */

let client = null;

if (config.twilio.accountSid && config.twilio.authToken) {
  client = twilio(config.twilio.accountSid, config.twilio.authToken);
  console.log('✅ Twilio client initialized');
} else {
  console.warn('⚠️  Twilio credentials missing — SMS/verify disabled');
}

/* ─── Plain SMS (e.g. SOS alerts to contacts) ─────────────────────────── */

async function sendSms(to, body) {
  if (!client) {
    console.log('[Twilio] No client — would SMS', to, ':', body);
    return { ok: false, reason: 'Twilio not configured' };
  }

  // Normalise phone: ensure + prefix for India numbers
  const formatted = formatPhone(to);

  try {
    if (config.twilio.from || config.twilio.messagingServiceSid) {
      // Build the message payload
      const payload = {
        to: formatted,
        body
      };

      // Prioritize the direct Twilio phone number to avoid Error 21704 
      // (Messaging Service contains no phone numbers)
      if (config.twilio.from) {
        payload.from = config.twilio.from;
      } else if (config.twilio.messagingServiceSid) {
        payload.messagingServiceSid = config.twilio.messagingServiceSid;
      }

      const msg = await client.messages.create(payload);
      console.log('[Twilio SMS] Successfully queued to', formatted, '| SID:', msg.sid, '| Status:', msg.status);
      return { ok: true, sid: msg.sid };
    } else {
      console.warn('[Twilio] No TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM set');
      return { ok: false, reason: 'No sender configured' };
    }
  } catch (err) {
    console.error('[Twilio SMS] Error:', err.message || err);
    return { ok: false, reason: err.message };
  }
}

/* ─── Automated Voice Call (e.g. SOS alerts) ─────────────────────────── */

async function sendCall(to, message) {
  if (!client) {
    console.log('[Twilio] No client — would Call', to);
    return { ok: false, reason: 'Twilio not configured' };
  }

  if (!config.twilio.from) {
    console.log('[Twilio Call] No TWILIO_FROM set — cannot place call to', to);
    return { ok: false, reason: 'No TWILIO_FROM configured' };
  }

  const formatted = formatPhone(to);

  try {
    // We use TwiML to dictate the text we want the call to say out loud
    const encodedMessage = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const twiml = `<Response><Pause length="1"/><Say voice="Polly.Joanna" language="en-US">Emergency Alert. ${encodedMessage}</Say><Pause length="1"/><Say voice="Polly.Joanna" language="en-US">I repeat. Emergency Alert. ${encodedMessage}</Say></Response>`;

    const call = await client.calls.create({
      twiml: twiml,
      to: formatted,
      from: config.twilio.from
    });

    console.log('[Twilio Call] Successfully placed to', formatted, '| SID:', call.sid, '| Status:', call.status);
    return { ok: true, sid: call.sid };
  } catch (err) {
    console.error(`[Twilio Call] Error sending to ${formatted}:`, err.message || err);
    return { ok: false, reason: err.message };
  }
}

/* ─── OTP via Twilio Verify ────────────────────────────────────────────── */

async function sendOtp(to) {
  if (!client || !config.twilio.verifySid) {
    console.log('[Twilio Verify] Not configured — would send OTP to', to);
    return { ok: false, reason: 'Twilio Verify not configured' };
  }

  const formatted = formatPhone(to);

  try {
    const verification = await client.verify.v2
      .services(config.twilio.verifySid)
      .verifications.create({ to: formatted, channel: 'sms' });

    console.log('[Twilio Verify] OTP sent to', formatted, '| Status:', verification.status);
    return { ok: true, status: verification.status };
  } catch (err) {
    console.error('[Twilio Verify] sendOtp error:', err.message || err);
    return { ok: false, reason: err.message };
  }
}

/* ─── Verify OTP code entered by user ─────────────────────────────────── */

async function verifyOtp(to, code) {
  if (!client || !config.twilio.verifySid) {
    console.log('[Twilio Verify] Not configured — would verify OTP for', to);
    return { ok: false, reason: 'Twilio Verify not configured' };
  }

  const formatted = formatPhone(to);

  try {
    const result = await client.verify.v2
      .services(config.twilio.verifySid)
      .verificationChecks.create({ to: formatted, code });

    const approved = result.status === 'approved';
    console.log('[Twilio Verify] OTP check for', formatted, '| Result:', result.status);
    return { ok: approved, status: result.status };
  } catch (err) {
    console.error('[Twilio Verify] verifyOtp error:', err.message || err);
    return { ok: false, reason: err.message };
  }
}

/* ─── Email (placeholder — integrate SendGrid/nodemailer as needed) ───── */

async function sendEmail(to, subject, body) {
  console.log('[Email] Not configured — would send to', to, '| Subject:', subject);
  // TODO: integrate SendGrid / nodemailer here
}

/* ─── Helpers ──────────────────────────────────────────────────────────── */

function formatPhone(phone) {
  if (!phone) return phone;
  const clean = String(phone).replace(/\D/g, '');

  // If it's 10 digits, assume India (+91)
  if (clean.length === 10) return '+91' + clean;

  // If it already starts with something like 91 but no +, add +
  if (clean.length > 10 && !String(phone).startsWith('+')) return '+' + clean;

  // Otherwise, return with + if not already there
  return String(phone).startsWith('+') ? phone : '+' + clean;
}

function isConfigured() {
  return Boolean(client && (config.twilio.from || config.twilio.messagingServiceSid));
}

module.exports = { sendSms, sendCall, sendOtp, verifyOtp, sendEmail, isConfigured };
