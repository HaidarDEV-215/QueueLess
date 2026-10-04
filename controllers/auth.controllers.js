const authServices = require('../services/auth.services.js');
const asyncWrapper = require('../middlewares/asyncWrapper.js');


const register = asyncWrapper(async (req, res) => {
    const { firstName, lastName, password, email, phone } = req.body;
    const token = await authServices.register(firstName, lastName, password, email, phone);
    res.status(201).json({ message: "user account created successfully", data: { token } });
});

const confirmAccount = asyncWrapper(async (req, res) => {
    const { id, email } = req.temporaryUser;
    const code = req.body.code;
    const token = await authServices.confirmAccount(email, id, code);
    res.status(200).json({ message: "account confirmed successfully", data: { token } });

})

const login = asyncWrapper(async (req, res) => {
    const { email, password } = req.body;
    const token = await authServices.login(email, password);
    res.status(200).json({ message: "user logged in successfully", data: { token } });
});

const forgetPassword = asyncWrapper(async (req, res) => {
    const email = req.body.email;
    await authServices.forgetPassword(email);
    res.status(200).json({ message: "a verification email sent!" });
});

const confirmOTP = asyncWrapper(async (req, res) => {
    const { code, email } = req.body;
    const token = await authServices.confirmOTP(code, email);
    res.status(200).json({ message: 'email verified', data: token });
});

const changePassword = asyncWrapper(async (req, res) => {
    const password = req.body.password;
    const email = req.temporaryUser.email;
    await authServices.changePassword(email, password);
    res.status(200).json({ message: 'password changed' });
})

module.exports = { register, confirmAccount, login, forgetPassword, confirmOTP, changePassword }