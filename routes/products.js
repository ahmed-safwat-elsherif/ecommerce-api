const express = require('express')
const router = express.Router()
const { authenticate, adminAuthenticate } = require('../auth/user');
const User = require('../models/userModel');
const Product = require('../models/productModel');

// get all products (from 0 to 15 with a skip)
router.get('/',async(req,res)=>{
    try {
        let { limit = 15, skip = 0 } = req.query;
        if (Number(limit) > 15) {
            limit = 15;
        }
        let products =  await Product.find().skip(Number(skip)).limit(Number(limit)).exec();
        if(!products) throw new Error(`Unabled to find any country to display`)
        res.status(200).send({ length: products.length, products })
    } catch (error) {
        res.status(401).send(error)
    }
})


// GET number of products
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

// POST product
router.post('/product',authenticate,adminAuthenticate, async(req,res)=>{
    try {
        let createdBy = req.signData._id;
        let {name,description, current_price=0,old_price=0} = req.body;
        console.log(current_price,old_price)
        current_price = Number(current_price);
        old_price = Number(old_price);
        let newProduct = await Product.create({name,description,createdBy,current_price,old_price});
        res.status(200).send({newProduct,message:"Product was added successfully", success:true})
    } catch (error) {
        res.status(400).send({error,message:"Adding product failed", success:false})
    }
})
// GET specific product info
router.get('/:_id',async(req,res)=>{
    try {
        let {_id} = req.params;
        let product = await Product.findOne({_id});
        res.status(200).send({product, success:true});
    } catch (error) {
        res.status(404).send({message:"Product is not found", success:false})
    }
})

// UPDATE product
router.patch('/:_id',authenticate,adminAuthenticate,async(req,res)=>{
    try {
        let {_id} = req.params;
        let {image, createdBy, rating,reviews} = await Product.findOne({_id});
        let {name, current_price,old_price,description} = req.body;
        let newUpdate = await Product.findOneAndUpdate({ _id }, {image, createdBy, rating,reviews,name, current_price,old_price,description}, {
            new: true
        }).exec();
        res.status(200).send({newUpdate,status:true, message:"Product has been updated successfully"})
    } catch (error) {
        res.status(404).send({message:"Error occured !", error,success:false})
    }
})
// DELETE Product 
router.delete('/:_id',authenticate,adminAuthenticate,async(req,res)=>{
    try {
        let {_id} = req.params;
        await Product.deleteOne({_id});
        await User.updateMany({}, { $pullAll: { favoriteProducts: [_id] } });
        res.status(200).send({success:true, message:"Product has been deleted successfully"})
    } catch (error) {
        res.status(404).send({message:"Error occured !", error,success:false})
    }
})

// POST the rating
router.post('/rating/:_id',authenticate,async(req,res)=>{
    try {
        let {_id} = req.params;
        let userId = req.signData._id;
        let {rating} = req.body;
        let product = await Product.findOne({_id});
        let found = product.reviews.find(review => review.userId == userId);
        if(found){
            let ind = product.reviews.findIndex(review => review.userId == userId);
            console.log("ind",ind)
            console.log("product.reviews",product.reviews)
            
            let numberOfreviews = product.reviews.length;
            console.log("numberOfreviews",numberOfreviews)
            
            let newRating = (Number(rating)+ Number(product.rating) - Number(found.rating))/numberOfreviews;
            console.log("rating",rating)
            console.log("product.rating",product.rating)
            console.log("found.rating",found.rating)
            console.log("newRating",newRating)
            product.reviews[ind].rating = rating;
            let newUpdate = await Product.findOneAndUpdate({ _id }, { reviews: product.reviews,rating:newRating }, {
                new: true
            });
            res.status(200).send({newUpdate,success:true, message:"Product has been deleted successfully"})
        } else {

            let numberOfreviews = product.reviews.length + 1;
            console.log("numberOfreviews",numberOfreviews)
            let newRating = (Number(rating)+ Number(product.rating))/numberOfreviews;
            console.log("rating",rating)
            console.log("product.rating",product.rating)
            console.log("newRating",newRating)
            let newUpdate = await Product.findOneAndUpdate({ _id }, { $addToSet: { reviews: [{userId,rating}] } }, {
                new: true
            });
            newUpdate = await Product.findOneAndUpdate({ _id }, {rating:newRating}, {
                new: true
            });
            res.status(200).send({newUpdate,success:true, message:"Product has been deleted successfully"})
        }
    } catch (error) {
        res.status(404).send({message:"Error occured !", error,success:false})
    }
})

// POST to favorites
router.post('/favorites/:_id',authenticate,async(req,res)=>{
    try {
        let{_id} = req.params;
        let userId = req.signData._id;
        await User.findOneAndUpdate({_id:userId}, { $addToSet: { favoriteProducts: [_id] } }, {
            new: true
        });
        res.status(200).send({message:"Added to favorite successfully",success:true})
    } catch (error) {
        res.status(200).send({message:"Added to favorite successfully",success:false})
    }
})

// DELETE from favorite
router.delete('/favorites/:_id',authenticate,async(req,res)=>{
    try {
        let{_id} = req.params;
        let userId = req.signData._id;
        await User.findOneAndUpdate({_id:userId}, { $pullAll: { favoriteProducts: [_id] } }, {
            new: true
        });
        res.status(200).send({message:"Deleted to favorite successfully",success:true})
    } catch (error) {
        res.status(200).send({message:"Deletion process was rejected",success:false})
    }
})
module.exports = router