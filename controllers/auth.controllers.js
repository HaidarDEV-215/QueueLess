const authServices = require('../services/auth.services.js');
const asyncWrapper = require('../middlewares/asyncWrapper.js');


const register = asyncWrapper(async (req, res) => {
    const { firstName, lastName, password, email, phone } = req.body;
    const token = await authServices.register(firstName, lastName, password, email, phone);
    res.status(201).json({ message: "user account created successfully", data: { token } });
})

const login = asyncWrapper(async (req, res) => {
    const { email, password } = req.body;
    const token = await authServices.login(email, password);
    res.status(200).json({ message: "user logged in successfully", data: { token } });

})


module.exports = { register ,login }