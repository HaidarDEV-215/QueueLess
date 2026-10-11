const emailService = require('./emailService.js');
const emailTemplates = require('./emailsTemplates.js');

// to do 
// email sender fo each purpose

const accountVerificationEmail = async (data) => {
    const { email, userName, otp } = data;
    await emailService(
        email,
        'account verification',
        emailTemplates.emailVerificationTemplate(userName, otp)
    ).catch((error) => {
        console.error(error.message);
        return false;
    });
    return true;
}

const nextTurnEmail = async (data) => {
    const { email ,userName} = data;
    await emailService(
        email,
        "your turn is next",
        emailTemplates.nextInQueueTemplate(userName, "test")
    ).catch((error) => {
        console.error(error.message);
        return false;
    });
    return true;
}

const yourTurnEmail = async (data) => {
    const { email ,userName} = data;
    await emailService(
        email,
        "It's your turn",
        emailTemplates.yourTurnTemplate(userName, "test")
    ).catch((error) => {
        console.error(error.message);
        return false;
    });
    return true;
}

module.exports = async (purpose, data) => {
    switch (purpose) {
        case 'account-verification': {
            return await accountVerificationEmail(data);
        }
        case 'next-turn': {
            return await nextTurnEmail(data);
        }
        case 'your-turn': {
            return await yourTurnEmail(data);
        }
    }
    return false;
}