const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt');
const { authenticate, adminAuthenticate } = require('../auth/user');
const { validate, userValidate } = require('../validations/userValidate')
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const User = require('../models/userModel')
const Product = require('../models/productModel')

router.post('/register', async (req, res, next) => {
    try {
        console.log(req.body)
        const { email = "", password = "", firstname = "", lastname = "", gender = 'male', profileImage = '4' } = req.body;
        let exists = await User.count({ email });
        console.log(exists)
        if (exists > 0) {
            return res.status(200).send({ exists: true, success: false, message: "Email is exists" })
        }
        console.log(password.length)
        if (password.length < 6) throw new Error({ error: 'password accepts only minimum 6 characters' })
        const hash = await bcrypt.hash(password, 7);
        console.log("HERERERERERE")
        const user = await User.create({ email, password: hash, firstname, lastname, gender, profileImage })
        const token = jwt.sign({ _id: user._id }, 'the-attack-titan');
        const confirmationLink = `https://amnesia-skincare.herokuapp.com/api/users/confirmation/${token}`;
        const message = `
        <div style="padding:30px 0 ;font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif;text-align: center; background-color:#eae3c8; color:#383e56; border-radius: 5px;">
            <p style="font-size:1.3rem; font-weight:bold">
                Welcome to <span style="font-family:'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif; color: coral;">Amnesia</span> 
            </p>
            <hr style="width:50%;"/>
            <h3 style="text-align: left; padding-left: 50px; margin-bottom: 2rem;">Hi, ${user.firstname}</h3>
            <div style="font-size: 1rem; padding-left: 50px; padding-bottom:20px; text-align: left;">
                <p>Thank you so much for joining our community.  &#128079; &#128170;<br><br> You have registered with email address: <b><i>${user.email}</i></b></p>
                <p>Only one step is needed. To complete the registeration, kindly press on button 'Verify me': </p>
            </div>
            <p style="text-align: center;"><a style="display: inline-block; padding:10px;background-color:coral; color:white;text-decoration: none;cursor: pointer;box-shadow: 0 0 8px gray;" href="${confirmationLink}">Verify me</a></p>
        </div>
        `
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'amnesia.ecommerce@gmail.com',
                pass: process.env.GMAIL_PASS || '0159357aA'  // need to be saved somewhere else to achieve the security
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // send mail with defined transport object
        let info = await transporter.sendMail({
            from: '"Amnesia - Skin Care" <amnesia.ecommerce@gmail.com>', // sender address
            to: email, // list of receivers
            subject: "Confirmation", // Subject line
            text: "Confirmation message", // plain text body
            html: message, // html body
        });

        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        delete user.password;
        res.status(201).send({ user, success: true, message: "sent successfully" })
    } catch (error) {
        if (error.keyPattern && error.keyPattern.email) {
            console.log(true, { error })
            res.status(409).send({ error, success: false });
            return;
        }
        console.log(false, { error })
        res.status(422).send({ error, success: false });
    }
})


router.get('/confirmation/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { _id } = jwt.verify(token, 'the-attack-titan');
        console.log({ _id });
        const user = await User.findOneAndUpdate({ _id }, { confirmation: true }, {
            new: true
        }).exec();
        res.redirect('http:localhost:4200/confirmed')
        delete user.password;
        res.status(200).send({ user, success: true, message: "User is confirmed!" })
    } catch (error) {
        res.status(400).send({ error, success: false, message: "Confirmation is denied!" })
        res.redirect('http:localhost:4200/failed')

    }
})

router.post('/login', validate, async (req, res, next) => {
    try {
        const { email, password } = req.body;
        console.log({ email, password })
        let all = await User.find();
        console.log('all', all)
        const user = await User.findOne({ email }).exec();
        console.log('user:', user)
        if (!user) throw new Error("wrong email or password");
        if (!user.confirmation) {
            return res.status(400).send({ success: false, confirmed: 'no', message: "Confirmation is required" })
        }
        const isMatched = await bcrypt.compare(password, user.password);
        console.log(isMatched)

        if (!isMatched) throw new Error("wrong email or password");
        const token = jwt.sign({ _id: user._id }, 'the-attack-titan');
        res.statusCode = 200;
        delete user.password;
        res.send({ message: "logged in successfully", confirmed: 'yes', success: true, user, token })
    } catch (error) {
        res.statusCode = 401;
        res.send({ error, message: "Invalid credentials", confirmed: 'invalid', success: false })
    }
})

router.post('/admin/login', validate, async (req, res, next) => {
    try {
        const { email, password } = req.body;
        console.log({ email, password })
        let all = await User.find();
        console.log('all', all)
        const user = await User.findOne({ email }).exec();
        if (!user.isAdmin) {
            res.status(401).send({ message: "Admin Authorization failed", success: false })
        }
        console.log('user:', user)
        if (!user) throw new Error("wrong email or password");
        if (!user.confirmation) {
            return res.status(400).send({ success: false, confirmed: 'no', message: "Confirmation is required" })
        }
        const isMatched = await bcrypt.compare(password, user.password);
        console.log(isMatched)

        if (!isMatched) throw new Error("wrong email or password");
        const token = jwt.sign({ _id: user._id }, 'the-attack-titan');
        res.statusCode = 200;
        delete user.password;
        res.send({ message: "logged in successfully", confirmed: 'yes', success: true, user, token })
    } catch (error) {
        res.statusCode = 401;
        res.send({ error, message: "Invalid credentials", confirmed: 'invalid', success: false })
    }
})

router.get('/profile', authenticate, async (req, res) => {
    try {
        console.log("GET PROFILE DATA")
        const { _id } = req.signData;
        console.log(_id)
        const user = await User.findOne({ _id }).populate('favoriteProducts');
        delete user.password;
        res.status(201).send({ user, success: true })
    } catch (error) {
        res.status(401).send({ error, message: 'user not found', success: false })
    }
})
router.get('/get/users/:pname', authenticate,adminAuthenticate, async (req, res) => {
    try {
        let { pname } = req.params;
        console.log(pname)
        let { limit = 5, skip = 0 } = req.query;
        if (Number(limit) > 5) {
            limit = 5;
        }
        let numOfUsers = await User.countDocuments().exec();
        let users = await User.find({
            $or:[
                {firstname: { $regex: new RegExp("^" + pname.toLowerCase(), "i") }},
                {lastname: { $regex: new RegExp("^" + pname.toLowerCase(), "i") }}
            ]
        }).skip(Number(skip)).limit(Number(limit)).exec();
        if (!users) throw new Error(`Unabled to find any country to display`)
        res.status(200).send({ length: numOfUsers, users })
    } catch (error) {
        res.status(401).send(error)
    }
})
router.patch('/changePassword', authenticate, async (req, res) => {
    try {
        let { _id } = req.signData;
        console.log(_id);
        let { password, newPassword } = req.body;
        let user = await User.findOne({ _id });
        console.log(user)
        console.log(password, user.password)
        let isMatched = await bcrypt.compare(password, user.password);
        console.log(isMatched)
        if (!isMatched) {
            return res.status(401).send({ err: "", success: false, message: "Unauthorized user, wrong password" })
        }

        password = await bcrypt.hash(newPassword, 7);
        user.password = password;
        let newUpdate = await User.findOneAndUpdate({ _id }, user, {
            new: true
        }).exec();
        delete newUpdate.password;
        res.status(200).send({ newUpdate, message: "password has been changed successfully", success: true })
    } catch (error) {
        res.status(400).send({ error, message: "Failure in changing password", success: false })
    }
})

router.post('/forgetPassword', async (req, res) => {
    try {
        let { email } = req.body;
        let user = await User.findOne({ email });
        console.log("USER :", user)
        if (!user) {
            return res.status(404).send({ message: "Email is not registered", success: false })
        }
        const token = jwt.sign({ _id: user._id }, 'the-attack-titan'); // expiration json web token in 2 hours
        const forgetPassword = `http://localhost:4200/resetpassword/${token}`;
        const message = `
        <div style="padding:30px 0 ;font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif;text-align: center; background-color:#eae3c8; color:#383e56; border-radius: 5px;">
            <p style="font-size:1.3rem; font-weight:bold">
                Welcome to <span style="font-family:'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif; color: coral;">Amnesia</span> 
            </p>
            <hr style="width:50%;"/>
            <h3 style="text-align: left; padding-left: 50px; margin-bottom: 2rem;">Hi, ${user.firstname}</h3>
            <div style="font-size: 1rem; padding-left: 50px; padding-bottom:20px; text-align: left;">
                <p>
                    A password reset event has been triggered. The password reset window is limited to two hours. If you do not reset your password within two hours, you will need to submit a new request. To complete the password reset process, visit the following link:
                </p>
            </div>
            <p style="text-align: center;">
                <a style="display: inline-block; padding:10px;background-color:green; color:white;text-decoration: none;cursor: pointer;box-shadow: 0 0 8px gray;" href="${forgetPassword}">Reset password</a>
            </p>
        </div>
        `
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'amnesia.ecommerce@gmail.com',
                pass: process.env.GMAIL_PASS || '0159357eE'  // need to be saved somewhere else to achieve the security
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // send mail with defined transport object
        let info = await transporter.sendMail({
            from: '"Amnesia - Skin Care" <amnesia.ecommerce@gmail.com>', // sender address
            to: email, // list of receivers
            subject: "Password Reset", // Subject line
            text: "Password Reset", // plain text body
            html: message, // html body
        });

        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        delete user.password;
        res.status(201).send({ user, success: true, message: "sent successfully" })
    } catch (error) {
        res.status(404).send({ message: "Unable to reset password", success: false, error })
    }
})

router.post('/reset/password', authenticate, async (req, res) => {
    try {
        let { _id } = req.signData;
        let { password } = req.body;
        const hash = await bcrypt.hash(password, 7);
        console.log("USER ID : ", _id)
        let user = await User.findByIdAndUpdate({ _id }, { password: hash }, {
            new: true
        }).exec();
        console.log(user)
        delete user.password;
        res.status(200).send({ message: "Password has been changed successfully", success: true, user })
    } catch (error) {
        res.status(400).send({ message: "Password failed to be changed", success: false, error })
    }
})

router.post('/contactus', async (req, res) => {
    try {
        let { email, subject, fullname, message, phone } = req.body;
        let toEmail = "sheryshawky2018@gmail.com";
        const fullmessage = `
        <div style="padding:30px 0 ;font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif;text-align: center; background-color:#eae3c8; color:#383e56; border-radius: 5px;">
            <p style="font-size:1.3rem; font-weight:bold">
                Message to <span style="font-family:'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif; color: coral;">Amnesia</span> 
            </p>
            <hr style="width:50%;"/>
            <h3 style="text-align: left; padding-left: 50px; margin-bottom: 2rem;">Message from: ${fullname}</h3>
            <div style="font-size: 1rem; padding-left: 50px; padding-bottom:20px; text-align: left;">
                <p>${message}</p>
                <p>message recieved from: ${email}</p>
                <p>phone number: ${phone}</p>
            </div>
        </div>
        `
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'amnesia.ecommerce@gmail.com',
                pass: process.env.GMAIL_PASS || '0159357eE'  // need to be saved somewhere else to achieve the security
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // send mail with defined transport object
        let info = await transporter.sendMail({
            from: '"Amnesia - Skin Care" <amnesia.ecommerce@gmail.com>', // sender address
            to: toEmail, // list of receivers
            subject: subject, // Subject line
            text: subject, // plain text body
            html: fullmessage, // html body
        });

        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

        res.status(201).send({ success: true, message: "sent successfully" })
    } catch (error) {
        res.status(422).send({ error, success: false });
    }
})
// Get all users in MongoDB
router.get('/get/users', authenticate, adminAuthenticate, async (req, res) => {
    try {
        let { limit = 10, skip = 0 } = req.query;
        if (Number(limit) > 10) {
            limit = 10;
        }
        let numOfUsers = await User.countDocuments().exec();
        let users = await User.find().skip(Number(skip)).limit(Number(limit)).exec();
        if (!users) throw new Error(`Unabled to find users to display`)
        res.status(200).send({ length: numOfUsers, users })
    } catch (error) {
        res.status(401).send(error)
    }
})
router.route('/')
    .delete(authenticate, async (req, res) => {
        try {
            const { _id } = req.signData;
            console.log(res.signData)
            let user = await User.findOne({ _id });
            console.log(user)
            await User.deleteOne({ _id });
            res.status(200).send({ message: "User was deleted successfully", success: true });

        } catch (error) {
            res.status(401).send({ error, success: false })
        }
    })
    .patch(authenticate, userValidate, async (req, res) => {
        try {
            const { _id } = req.signData;
            console.log(_id)
            let { email, gender, userPassword, firstname, lastname, addresses, phones } = req.body;
            let user = await User.findOne({ _id });

            console.log("HERE is USER", user)
            // console.log(userPassword, user.password)
            const isMatched = await bcrypt.compare(userPassword, user.password);
            // console.log(isMatched)
            if (!isMatched) {
                return res.status(401).send({ err: "", success: false, message: "Unauthorized user, wrong password" })
            }
            const newUpdate = await User.findOneAndUpdate({ _id }, {
                email, gender, firstname, lastname, addresses, phones,
                password: user.password,
                confirmation: user.confirmation,
                profileImage: user.profileImage,
                favoriteProducts: user.favoriteProducts,
                isAdmin: user.isAdmin
            }, {
                new: true
            }).exec();
            if (!newUpdate) throw new Error({ error: "Error in updating user info" })
            delete newUpdate.password;
            res.status(201).send({ message: "user was edited successfully", newUpdate, valid: true, success: true })
        } catch (error) {
            res.status(401).send({ error: "Error in updating user info", success: false });
        }
    })
module.exports = router;