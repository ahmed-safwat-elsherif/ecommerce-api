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
module.exports.adminAuthenticate = async (req, res, next) => {
    try {
        const {authorization} = req.headers;
        let _id = req.signData._id;
        console.log("_id:",_id)
        _id = mongoose.Types.ObjectId(_id)
        console.log("_id:",_id)
        let user = await User.findById({_id});
        if(user){
            if(!user.isAdmin){
                console.log("Is not admin")
                // res.status(200).send({success:false,message:"Admin Authentication failed"})
                next("err")
            } else {
                console.log("Is admin")
                next()
            }
        } else {
            return res.status(401).send({success:false,message:"Admin Authentication failed"})
        }
    } catch (error) {
        res.status(404).send({success:false,error,message:"Authentication failed"})
    }
}