const express = require('express')
const router = express.Router()
const { authenticate, adminAuthenticate } = require('../auth/user');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');


router.post('/',authenticate,async(req,res)=>{
    try {
        let userId = req.signData._id;
        console.log(userId,req.body)
        let {products, note, address} = req.body;
        let order = await Order.create({products,userId,note,address})
        res.status(200).send({order,message:"Order is successfully sent", status:true})
    } catch (error) {
        res.status(401).send({message:"Unable to create an order", status:false, error})
    }
})


module.exports = router