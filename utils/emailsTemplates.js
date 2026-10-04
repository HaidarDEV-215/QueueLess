const emailVerificationTemplate = (OTP) => {
    return `
    <div style="max-width: 400px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; text-align: center; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
    <h2 style="color: #d97706; margin: 0 0 10px 0; font-size: 22px; font-weight: 700;">
        Email Verification Code
    </h2>
    <p style="color: #4b5563; font-size: 14px; margin: 0 0 20px 0;">
        Don't share this code with anyone.
    </p>
    <div style="border: 2px dashed #059669; border-radius: 12px; padding: 14px 20px; background-color: #f0fdf4; color: #047857; font-size: 32px; font-weight: bold; letter-spacing: 6px; display: inline-block; margin-bottom: 20px;">
        ${OTP}
    </div>
    <p style="color: #6b7280; font-size: 12px; margin: 0;">
        This code will expire in <strong style="color: #374151;">5 minutes</strong>.
    </p>`;
}


module.exports = {
    emailVerificationTemplate
}