const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt');
const { authenticate } = require('../auth/user');
const { validate, userValidate } = require('../validations/userValidate')
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const User = require('../models/userModel')


router.post('/register', async (req, res, next) => {
    try {
        console.log(req.body)
        const { email="", password="", firstname="", lastname="",gender='male',profileImage='' } = req.body;
        console.log(password.length)
        if(password.length < 6) throw new Error({error:'password accepts only minimum 6 characters'})
        const hash = await bcrypt.hash(password, 7);
        const user = await User.create({ email, password: hash, firstname, lastname,gender })
        const token = jwt.sign({ _id: user._id }, 'the-attack-titan');
        const confirmationLink = `http://localhost:3000/api/users/confirmation/${token}`;
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
              pass: process.env.GMAIL_PASS||'0159357eE'  // need to be saved somewhere else to achieve the security
            },
            tls:{
                rejectUnauthorized:false
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
        res.status(201).send({ user,success:true, message: "sent successfully" })
    } catch (error) {
        if (error.keyPattern && error.keyPattern.email){
            console.log(true,{error})
            res.status(409).send({error,success:false});
            return;
        } 
        console.log(false, {error})
        res.status(422).send({ error,success:false });
    }
})

router.get('/confirmation/:token',async(req,res)=>{
    try {
        const {token} = req.params;
        const {_id} = jwt.verify(token, 'the-attack-titan');
        console.log({_id});
        const user = await User.findOneAndUpdate({_id},{confirmation:true},{
            new: true
        }).exec();
        res.redirect('https://www.google.com/')
        res.status(200).send({user,success:true,message:"User is confirmed!"})
    } catch (error) {
        res.status(400).send({error, success:false,message:"Confirmation is denied!"})
        res.redirect('http://localhost:3000/confirmation-failed')

    }
})

router.post('/login', validate, async (req, res, next) => {
    try {
        const { email, password } = req.body;
        console.log({email, password})
        let all = await User.find();
        console.log('all',all)
        const user = await User.findOne({ email }).exec();
        console.log('user:',user)
        if (!user) throw new Error("wrong email or password");
        if (!user.confirmation) throw new Error("Confirmation is needed")
        const isMatched = await bcrypt.compare(password, user.password);
        console.log(isMatched)
        
        if (!isMatched) throw new Error("wrong email or password");
        const token = jwt.sign({ _id: user._id }, 'the-attack-titan');
        res.statusCode = 200;
        res.send({ message: "logged in successfully",success:true, email: user.email,fullName:user.fullName, token })
    } catch (error) {
        res.statusCode = 401;
        res.send({ error,message: "Invalid credentials",success:false })
    }
})

router.get('/profile', authenticate, async (req, res) => {
    try {
        const { _id } = req.signData;
        console.log(_id)
        const { email, fullName, todoId, todoGroupId } = await User.findOne({ _id }).populate('todoId todoGroupId');
        res.status(201).send({ email,fullName, todoId, todoGroupId })
    } catch (error) {
        res.status(401).send({ error, message: 'user not found',success:false })
    }
})



router.route('/')
    .delete(authenticate, async (req, res) => {
        try {
            const { _id } = req.signData;
            console.log(res.signData)
            let user = await User.findOne({_id});
            console.log(user)
            await Todo.deleteMany({ userId:_id})
            await TodoGroup.deleteMany({ userId:_id })
            await User.deleteOne({ _id })
            res.status(200).send({ message: "User was deleted successfully", success:true });

        } catch (error) {
            res.status(401).send({ error,success:false })
        }
    })
    .patch(authenticate, userValidate, async (req, res) => {
        try {
            console.log()
            const { _id } = req.signData;
            let newUpdate = req.body;
            // if (!newUpdate.password) throw new Error({error: "password should be passed to the body of the request"})
            let updates = {
                email:newUpdate.email,
                fullName:newUpdate.fullName
            }
            if (newUpdate.newPassword) {
                updates.password = await bcrypt.hash(newUpdate.newPassword, 7);
            }
            const user = await User.findOneAndUpdate({ _id }, updates, {
                new: true
            }).exec();
            if(!user) throw new Error({error:"Error in updating user info"})
            res.status(201).send({ message: "user was edited successfully", user,valid:true,success:true })
        } catch (error) {
            res.status(401).send({error,success:false}); 
        }
    })

module.exports = router