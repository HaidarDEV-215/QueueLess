const jwt = require('jsonwebtoken');

module.exports = async (payload)=>{
    const token = await jwt.sign(payload,process.env.SECURITY_CODE,{expiresIn:'30d'});
    return token;
}