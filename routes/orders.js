const express = require('express')
const router = express.Router()
const { authenticate, adminAuthenticate } = require('../auth/user');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');

// sdfds 

router.post('/',authenticate,async(req,res)=>{
    try {
        console.log("//")
        let userId = req.signData._id;
        console.log(userId,req.body)
        let {products, note, address} = req.body;
        console.log(products,note, address);
        let toNumber = [];
        console.log(toNumber);
        products.map(product=>{
            toNumber.push({productId:product.productId, quantity:Number(product.quantity)})
        })
        console.log(toNumber);
        products = toNumber;
        console.log(products);
        let order = await Order.create({products,userId,note,address})
        res.status(200).send({order,message:"Order is successfully sent", success:true})
    } catch (error) {
        res.status(401).send({message:"Unable to create an order", success:false, error})
    }
})

/// Get all orders with limit skip , filtered with status
router.get('/all/:status',authenticate,adminAuthenticate,async(req,res)=>{
    try {
        let {status} = req.params;
        if(!['accepted','canceled','pending'].includes(status)){
            return res.status(404).send({success:false,message:"Check the status param"})
        }
        let { limit = 10, skip = 0 } = req.query;
        if (Number(limit) > 10) {
            limit = 10;
        }
        let numOfOrders =  await Order.countDocuments().exec();
        let orders =  await Order.find({status}).skip(Number(skip)).limit(Number(limit)).exec();
        if(!orders) throw new Error(`Unabled to find orders to display`)
        res.status(200).send({ length: numOfOrders, orders })
        // let orders = await Order.find({status})
    } catch (error) {
        res.status(401).send({message:"Unabled to find orders to display",error})
    }
})

// Find all orders per user
router.get('/for/:userId',authenticate,adminAuthenticate,async(req,res)=>{
    try {
        let {userId} = req.params;
        let user = await User.find({_id:userId})
        let orders = await Order.find({userId});
        res.status(200).send({orders, userId,user,message:"Orders fetched successfully", success:true})
    } catch (error) {
        res.status(401).send({error,message:"Orders fetching failed", success:false})
    }
})

router.get('/fetch/all',authenticate,async(req,res)=>{
    try {
        let {_id} = req.signData;
        let user = await User.find({_id:userId})
        let orders = await Order.find({userId:_id});
        res.status(200).send({orders, userId,user,message:"Orders fetched successfully", success:true})
    } catch (error) {
        res.status(401).send({error,message:"Orders fetching failed", success:false})
    }
})

router.get('/order/:_id',authenticate,async(req,res)=>{
    try {
        let userId = req.signData._id;
        console.log(userId,req.body)
        let {_id} = req.params;
        let order = await Order.findOne({_id}).populate('products.productId');
        res.status(200).send({order,success:true})
    } catch (error) {
        res.status(401).send({error,message:"Unable to get order",success:false})
    }
})

// router.get('/all',authenticate,async(req,res)=>{
//     try {
//         let userId = req.signData._id;
//         let orders = await Order.find({userId}).populate('products.productId');
//         res.status(200).send({orders,success:true})
//     } catch (error) {
//         res.status(401).send({error,message:"Unable to get user's orders",success:false})
//     }
// })

router.patch('/',authenticate,async(req,res)=>{
    try {
        let userId = req.signData._id;
        let {_id,products,note,address} = req.body;
        let order = await Order.findOneAndUpdate({_id},{products,note,address},{
            new:true
        }).exec();
        res.status(200).send({order,message:"Order has been updated successfully", success:true})
    } catch (error) {
        res.status(401).send({error,message:"Unable to update order", success:false})
    }
})

router.delete('/',authenticate,async(req,res)=>{
    try {
        let userId = req.signData._id;
        let {_id} = req.body;
        await Order.findOneAndDelete({_id});
        res.status(200).send({order,message:"Order has been deleted successfully", success:true})
    } catch (error) {
        res.status(401).send({error,message:"Unable to delete order", success:false})
    }
})

router.patch('/changestatus',authenticate,adminAuthenticate,async(req,res)=>{
    try {
        let {_id,orderStatus} = req.body;
        let order = await Order.findOneAndUpdate({_id},{orderStatus},{
            new:true
        }).exec()
        res.status(200).send({order,message:"Order's status has been updated successfully", success:true})
    } catch (error) {
        res.status(401).send({error,message:"Unable to update order's status", success:false})
    }
})
module.exports = router