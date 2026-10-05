import nodemailer from "nodemailer";
import twilio from "twilio";
import { Collections } from "./db.js";

let mailer;
let smsClient;

function getMailer() {
  if (mailer) return mailer;

  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    console.warn("[Notification] SMTP configuration missing.");
    return null;
  }

  mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return mailer;
}

function getSmsClient() {
  if (smsClient) return smsClient;

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return null;
  }

  smsClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN,
  );

  return smsClient;
}

export async function sendNotification({
  recipientEmail,
  recipientPhone,
  recipientRole = "visitor",
  type = "email",
  subject = "Visitor Pass Notification",
  message,
  html,
  attachments = [],
}) {
  let status = "queued";
  let provider = type;
  let providerMessageId = "";

  try {
    if (type === "email") {
      const transport = getMailer();

      if (!transport || !recipientEmail) {
        status = "queued";

        console.warn(
          "[Notification] Email queued: SMTP configuration or recipient missing.",
        );
      } else {
        const mailOptions = {
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: recipientEmail,
          subject,
          text: String(message || ""),
          html: html ? String(html) : undefined,
          attachments: Array.isArray(attachments) ? attachments : [],
        };

        console.log(`[Notification] Sending email to ${recipientEmail}`);

        console.log(`[Notification] HTML: ${mailOptions.html ? "YES" : "NO"}`);

        console.log(
          `[Notification] Attachments: ${mailOptions.attachments.length}`,
        );

        const result = await transport.sendMail(mailOptions);

        status = "sent";
        providerMessageId = result.messageId || "";

        console.log(
          `[Notification] Email sent successfully to ${recipientEmail}`,
        );

        console.log(
          `[Notification] Email content type: ${
            html ? "HTML + TEXT" : "TEXT ONLY"
          }`,
        );
      }
    } else if (type === "sms") {
      const client = getSmsClient();

      const fromNumber =
        process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_PHONE_NUMBER;

      if (!client || !recipientPhone || !fromNumber) {
        status = "queued";

        console.warn(
          "[Notification] SMS queued: Twilio configuration or recipient missing.",
        );
      } else {
        const smsBody = String(message || "Visitor Pass Notification");
        const result = await client.messages.create({
          body: smsBody,
          from: fromNumber,
          to: String(recipientPhone),
        });

        status = "sent";
        providerMessageId = result.sid || "";

        console.log(
          `[Notification] SMS sent successfully to ${recipientPhone}`,
        );
      }
    } else {
      status = "queued";
      provider = "system";
    }
  } catch (error) {
    status = "failed";

    console.error(`[Notification] ${type} delivery failed:`, error.message);
  }

  const notification = await Collections.notifications.insertOne({
    id: "notif_" + Date.now().toString(36),
    recipientEmail,
    recipientPhone,
    recipientRole,
    type,
    provider,
    providerMessageId,
    subject,
    message,
    timestamp: new Date().toISOString(),
    status,
  });

  return notification;
}
