const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const mongoose = require('mongoose')
module.exports.authenticate = (req, res, next) => {
    try {
        let { authorization } = req.headers;

        authorization = authorization.split(' ');
        if(authorization.length == 2){
            console.log("bearer")
            authorization = authorization[1];
        } else {
            authorization = authorization[0];
        }
        console.log("auth token: ",authorization)
        const signData = jwt.verify(authorization, 'the-attack-titan');
        console.log("signData:", signData)
        req.signData = signData;
        next();
    } catch (error) {
        res.status(401).send({ success: false, error: "Authorization failed" });
    }
}
module.exports.adminAuthenticate = async (req, res, next) => {
    try {
        // const { authorization } = req.headers;
        let _id = req.signData._id;
        console.log("_id:", _id)
        _id = mongoose.Types.ObjectId(_id)
        console.log("_id:", _id)
        let user = await User.findById({ _id });
        if(!user){
            return res.status(404).send({message:"no user found", success:false})
        }
        if (!user.isAdmin) {
            console.log("Is not admin")
            return res.status(401).send({ success: false, message: "Admin Authentication failed" })
        } 
        console.log("Is admin")
        next()
    } catch (error) {
        res.status(404).send({ success: false, error, message: "Admin Authentication failed" })
    }
}