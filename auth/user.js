const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
module.exports.authenticate = (req, res, next) => {
    try {
        const {authorization} = req.headers;
        console.log(authorization)
        const signData = jwt.verify(authorization, 'the-attack-titan');
        console.log("signData:",)
        req.signData = signData;
        next();
    } catch (error) {
        res.statusCode = 401;
        res.send({success: false, error:"Authorization failed"});
    }
}
module.exports.adminAuthenticate = (req, res, next) => {
    const {authorization} = req.headers;
    const signData = jwt.verify(authorization, 'the-attack-titan');
    User.findOne({_id:signData._id},(err,user)=>{
        if(err){
            return res.status(404).send({success:false,err,message:"Authentication failed"})
        }
        if(!user.isAdmin){
            return res.status(401).send({success:false,message:"Admin Authentication failed"})
        }
        req.signData = signData;
    })
    next();
}