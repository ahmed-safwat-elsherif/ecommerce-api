const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const mongoose = require('mongoose')
module.exports.authenticate = (req, res, next) => {
    try {
        const {authorization} = req.headers;
        console.log(authorization)
        const signData = jwt.verify(authorization, 'the-attack-titan');
        console.log("signData:",signData)
        req.signData = signData;
        next();
    } catch (error) {
        res.status(401).send({success: false, error:"Authorization failed"});
    }
}
module.exports.adminAuthenticate = (req, res, next) => {
    const {authorization} = req.headers;
    let _id = req.signData._id;
    // const signData = jwt.verify(authorization, 'the-attack-titan');
    console.log("_id:",_id)
    _id = mongoose.Types.ObjectId(_id)
    console.log("_id:",_id)
    // User.findById({_id:"604089f23de5460015a7e3ea"},(err,user)=>{
    //     console.log(user)
    // })
    User.findById({_id},(err,user)=>{
        if(err){
            return res.status(404).send({success:false,err,message:"Authentication failed"})
        }
        console.log("USER:",user)
        if(user){
            if(!user.isAdmin){
                console.log("Is not admin")
                return res.status(401).send({success:false,message:"Admin Authentication failed"})
            } else {
                console.log("Is admin")
                next();
            }
        } else {
            return res.status(401).send({success:false,message:"Admin Authentication failed"})
        }
        // req.signData = signData;
    })
}