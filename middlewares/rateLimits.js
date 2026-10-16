const {rateLimit, ipKeyGenerator} = require('express-rate-limit');

const generateKeyById = (req)=>{
    const ip = ipKeyGenerator(req.ip,56);
    return `${ip}-${req.baseUrl}-${req.path}`;
}

const requestLimiter = rateLimit({
    windowMs: 15*60*1000, //15 minutes
    limit: 20, // 20requist for each window (15 min)
    standardHeaders:"draft-8",
    legacyHeaders:false,
    skip:(req,res)=>false,
    keyGenerator:generateKeyById,
    handler:(req,res,next,options)=>{
        res.status(options.statusCode).json({error:"you reach your limit",message:"try again latter",code:options.statusCode})
    }
});

const postRequestLimiter = rateLimit({
    windowMs: 1000*60*60*24, //one day
    limit: 20, // 20requist for each window (15 min)
    standardHeaders:"draft-8",
    legacyHeaders:false,
    skip:(req,res)=>false,
    keyGenerator:generateKeyById,
    handler:(req,res,next,options)=>{
        res.status(options.statusCode).json({error:"you reach your limit",message:"try again latter",code:options.statusCode})
    }
});

const baseAuthLimiter = {
    windowMs: 60 * 60 * 1000, // 1 hour
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator:generateKeyById,
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json({
            error: "you reached your limit",
            message: "try again later",
            code: options.statusCode
        });
    }
};

const loginLimiter = rateLimit({ ...baseAuthLimiter, limit: 5 });
const registerLimiter = rateLimit({ ...baseAuthLimiter, limit: 3 });
const confirmAccountLimiter = rateLimit({...baseAuthLimiter, limit:5});
const forgetPasswordLimiter = rateLimit({ ...baseAuthLimiter, limit: 3 });
const confirmOTPLimiter = rateLimit({ ...baseAuthLimiter, limit: 5 });
const resetPasswordLimiter = rateLimit({ ...baseAuthLimiter, limit: 5 });

module.exports = {
    loginLimiter,
    registerLimiter,
    forgetPasswordLimiter,
    confirmOTPLimiter,
    resetPasswordLimiter,
    requestLimiter,
    confirmAccountLimiter,
    postRequestLimiter
};