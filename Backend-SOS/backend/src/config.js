const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

if (!process.env.MONGODB_URI) {
  console.warn("⚠️ MONGODB_URI is not defined; continuing with fallback in-memory user storage");
}

module.exports = {
  mongodbUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sos",

  jwtSecret: process.env.JWT_SECRET || "devsecret",

  port: process.env.PORT || 5000,

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || "",
    authToken:  process.env.TWILIO_AUTH_TOKEN  || "",
    from:       process.env.TWILIO_FROM        || "",
    verifySid:  process.env.TWILIO_VERIFY_SID  || "",
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID || ""
  }
};