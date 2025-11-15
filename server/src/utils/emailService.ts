import nodemailer from 'nodemailer'

// Create transporter
const createTransporter = () => {
  // Check if using 163 email
  const isNetEase = process.env.EMAIL_USER?.includes('@163.com')

  if (isNetEase) {
    // NetEase 163 Mail configuration
    return nodemailer.createTransport({
      host: 'smtp.163.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // 163邮箱需要使用授权码，不是登录密码
      }
    })
  } else {
    // Gmail configuration
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    })
  }
}

// Send verification code email
export const sendVerificationCode = async (email: string, code: string) => {
  const transporter = createTransporter()

  const mailOptions = {
    from: `"Chiavow" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Chiavow Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Chiavow</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">中国旅行 WOW</p>
        </div>

        <div style="background: #f8f9fa; padding: 40px 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin: 0 0 20px 0;">Your Verification Code</h2>

          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Thank you for registering with Chiavow! Please use the following verification code to complete your registration:
          </p>

          <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
            <div style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${code}
            </div>
          </div>

          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            This code will expire in <strong>10 minutes</strong>. If you didn't request this code, please ignore this email.
          </p>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;" />

          <p style="color: #999; font-size: 12px; line-height: 1.6; margin: 0;">
            This is an automated message, please do not reply to this email.
          </p>
        </div>
      </div>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`✅ Verification code sent to ${email}`)
    return true
  } catch (error) {
    console.error('❌ Failed to send email:', error)
    return false
  }
}
