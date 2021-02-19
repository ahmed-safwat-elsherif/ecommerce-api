const express = require('express')
const router = express.Router()
const { authenticate, adminAuthenticate } = require('../auth/user');
const User = require('../models/userModel');
const Product = require('../models/productModel');
router.get('/',async(req,res)=>{
    try {
        let { limit = 15, skip = 0 } = req.query;
        if (Number(limit) > 15) {
            limit = 15;
        }
        let products =  await Country.find().skip(Number(skip)).limit(Number(limit)).exec();
        if(!products) throw new Error(`Unabled to find any country to display`)
        res.status(200).send({ length: products.length, products })
    } catch (error) {
        res.status(401).send(error)
    }
})
router.get('/noOfRecords', async (req,res)=>{
    console.log("ASDF")
    try {
        let numOfProducts =  await Product.countDocuments().exec();
        if(!numOfProducts) throw new Error('Unabled to find any Product to count')
        res.status(200).send({ numOfProducts,success:true })
    } catch (error) {
        res.status(401).send({error,success:false})
    }
})

router.post('/product',authenticate,adminAuthenticate, async(req,res)=>{
    try {
        let createdBy = req.signData._id;
        let {name,description} = req.body;
        let newProduct = await Product.create({name,description,createdBy});
        res.status(200).send({newProduct,message:"Product was added successfully", success:true})
    } catch (error) {
        res.status(400).send({error,message:"Adding product failed", success:false})
    }
})

module.exports = router