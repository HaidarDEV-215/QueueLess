const emailVerificationTemplate = (userName, OTP) => {
    return `
    <div style="max-width: 400px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; text-align: center; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
        <div style="font-size: 13px; font-weight: 700; color: #2563eb; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 16px;">
            QueueLess
        </div>
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 12px 0;">
            Hello <strong style="color: #1f2937; font-size: 15px;">${userName}</strong>,
        </p>
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
        </p>
    </div>`;
};

const yourTurnTemplate = (userName, serviceName) => {
    return `
    <div style="max-width: 400px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; text-align: center; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
        <div style="font-size: 13px; font-weight: 700; color: #2563eb; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 16px;">
            QueueLess
        </div>
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 12px 0;">
            Hello <strong style="color: #1f2937; font-size: 15px;">${userName}</strong>,
        </p>
        <h2 style="color: #059669; margin: 0 0 10px 0; font-size: 22px; font-weight: 700;">
            It's Your Turn!
        </h2>
        <p style="color: #4b5563; font-size: 14px; margin: 0 0 20px 0;">
            Please proceed to the service area immediately.
        </p>
        <p style="color: #6b7280; font-size: 13px; margin: 0;">
            Service: <strong style="color: #374151;">${serviceName}</strong>
        </p>
    </div>`;
};

const nextInQueueTemplate = (userName, serviceName) => {
    return `
    <div style="max-width: 400px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; text-align: center; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
        <div style="font-size: 13px; font-weight: 700; color: #2563eb; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 16px;">
            QueueLess
        </div>
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 12px 0;">
            Hello <strong style="color: #1f2937; font-size: 15px;">${userName}</strong>,
        </p>
        <h2 style="color: #d97706; margin: 0 0 10px 0; font-size: 22px; font-weight: 700;">
            You are Next in Line!
        </h2>
        <p style="color: #4b5563; font-size: 14px; margin: 0 0 20px 0;">
            Get ready, your turn is coming up very soon.
        </p>
        <p style="color: #6b7280; font-size: 13px; margin: 0;">
            Service: <strong style="color: #374151;">${serviceName}</strong>
        </p>
    </div>`;
};

module.exports = {
    emailVerificationTemplate,
    yourTurnTemplate,
    nextInQueueTemplate
}