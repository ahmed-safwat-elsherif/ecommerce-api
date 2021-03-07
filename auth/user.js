const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
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
    const _id = req.signData._id;
    const signData = jwt.verify(authorization, 'the-attack-titan');
    User.findOne({_id},(err,user)=>{
        if(err){
            return res.status(404).send({success:false,err,message:"Authentication failed"})
        }
        console.log(user)
        if(user){
            if(!user.isAdmin){
                return res.status(401).send({success:false,message:"Admin Authentication failed"})
            }
        }
        req.signData = signData;
    })
    next();
}