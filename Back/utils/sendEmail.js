const nodemailer = require('nodemailer');

const sendEmail = async (useremail, subject, htmlTemplet) => {
  try {
    const user = (process.env.EMAIL_NAME || process.env.EMAIL_USER || '').trim();
    const pass = (process.env.EMAIL_APP_PASS || process.env.EMAIL_PASSWORD || '').trim();
    const from = (process.env.EMAIL_FROM || user).trim();
    const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = Number(process.env.EMAIL_PORT || 465);
    const secure = process.env.EMAIL_SECURE
      ? /^(true|1)$/i.test(process.env.EMAIL_SECURE)
      : port === 465;

    if (!user || !pass) {
      throw new Error(
        'Missing email SMTP credentials. Set EMAIL_NAME/EMAIL_USER and EMAIL_APP_PASS/EMAIL_PASSWORD in your environment.'
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.verify();

    await transporter.sendMail({
      from,
      to: useremail,
      subject,
      html: htmlTemplet
    });
  } catch (error) {
    console.error('Nodemailer Error:', error);
    if (error.responseCode === 535 || /Invalid login|Web Login Required|Authentication failed/i.test(error.message)) {
      throw new Error(
        'Email delivery failed: invalid Gmail credentials. Use a valid Gmail account with an app password or update your SMTP settings.'
      );
    }
    throw error;
  }
};

module.exports = sendEmail;