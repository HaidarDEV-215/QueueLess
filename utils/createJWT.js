const jwt = require('jsonwebtoken');

module.exports = async (payload, expirationTime = '30d') => {
    const token = await jwt.sign(
        payload, 
        process.env.SECURITY_CODE, 
        { expiresIn: expirationTime }
    );
    return token;
}