const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // If email credentials aren't set, just log to console and return true
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.log("==========================================================");
    console.log(`[SIMULATED EMAIL] To: ${options.email}`);
    console.log(`[SIMULATED EMAIL] Subject: ${options.subject}`);
    console.log(`[SIMULATED EMAIL] Message:\n${options.message}`);
    console.log("==========================================================");
    console.log("NOTE: Configure SMTP_EMAIL and SMTP_PASSWORD in .env to send real emails.");
    return true;
  }

  // Create a transporter
  const transporter = nodemailer.createTransport({
    service: "gmail", // Using gmail as default, can be changed based on env vars if needed
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // Define email options
  const message = {
    from: `${process.env.FROM_NAME || 'Gyaanuday Support'} <${process.env.SMTP_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html, // Optional HTML message
  };

  // Send the email
  try {
    const info = await transporter.sendMail(message);
    console.log("Message sent: %s", info.messageId);
    return true;
  } catch (err) {
    console.error("Error sending email:", err);
    return false;
  }
};

module.exports = sendEmail;
