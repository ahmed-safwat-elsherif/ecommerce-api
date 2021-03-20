const express = require('express')
const router = express.Router()
const { authenticate, adminAuthenticate } = require('../auth/user');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Image  = require('../models/imageModel')
const ImageChunk  = require('../models/imageChunkModel')
// get all products (from 0 to 15 with a skip)
router.get('/',async(req,res)=>{
    try {
        console.log("/",req.url)
        let { limit = 15, skip = 0 } = req.query;
        if (Number(limit) > 15) {
            limit = 15;
        }
        let numOfProducts =  await Product.countDocuments().exec();
        let products =  await Product.find().skip(Number(skip)).limit(Number(limit)).exec();
        if(!products) throw new Error(`Unabled to find any country to display`)
        res.status(200).send({ length: numOfProducts, products })
    } catch (error) {
        res.status(401).send(error)
    }
})
router.get('/:pname',async(req,res)=>{
    try {
        console.log("pname /",req.url)
        let {pname} = req.params;
        console.log("pname: ",pname)
        console.log(pname)
        let { limit = 15, skip = 0 } = req.query;
        if (Number(limit) > 15) {
            limit = 15;
        }
        let numOfProducts =  await Product.countDocuments({name:pname}).exec();
        let products =  await Product.find({name:{ $regex: new RegExp("^" + pname.toLowerCase(), "i") }}).skip(Number(skip)).limit(Number(limit)).exec();
        if(!products) throw new Error(`Unabled to find any product to display`)
        res.status(200).send({ length: numOfProducts, products })
    } catch (error) {
        res.status(401).send(error)
    }
})


router.get('/search/:pname',async(req,res)=>{
    try {
        let {pname} = req.params;
        let numOfProducts =  await Product.countDocuments().exec();
        let products =  await Product.find({name:{ $regex: new RegExp("^" + pname.toLowerCase(), "i") }}).skip(Number(0)).limit(Number(numOfProducts)).exec();
        res.status(200).send({ length: numOfProducts, products })
    } catch (error) {
        res.status(401).send(error)
    }
})

router.get('/get/all',async(req,res)=>{
    try {
        let numOfProducts =  await Product.countDocuments().exec();
        let products = await Product.find().skip(Number(0)).limit(Number(numOfProducts)).exec();
        res.status(200).send({products,length:numOfProducts, success:true,message:"ALL PRODUCTS RETRIEVED SUCCESSFULLY"});
    } catch (error) {
        res.status(400).send({error,message:"failed to retrieve"})
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
        let {name,description, current_price=0,old_price=0,status="normal"} = req.body;
        console.log(current_price,old_price)
        current_price = Number(current_price);
        old_price = Number(old_price);
        let newProduct = await Product.create({name,description,createdBy,current_price,old_price,status});
        res.status(200).send({newProduct,message:"Product was added successfully", success:true})
    } catch (error) {
        res.status(400).send({error,message:"Adding product failed", success:false})
    }
})
// GET specific product info
router.get('/product/:_id',async(req,res)=>{
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
        let {name, current_price,old_price,description,status} = req.body;
        let newUpdate = await Product.findOneAndUpdate({ _id }, {image, createdBy, rating,reviews,name, current_price,old_price,description,status}, {
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
        let product = await Product.findOne({_id});
        console.log(product)
        if(product.image.length == 0){
            let image = await Image.findOneAndDelete({filename:product.image});
            console.log(image)
            await ImageChunk.deleteMany({files_id:image?._id})
        }
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
        console.log("RATING PRODUCT with ID",_id)
        if(found){
            console.log("FOUND !!")
            let ind = product.reviews.findIndex(review => review.userId == userId);
            // console.log("ind",ind)
            // console.log("product.reviews",product.reviews)
            product.reviews[ind].rating = rating;
            let numberOfreviews = product.reviews.length;
            
            // let newRating = (Number(rating)+ Number(product.rating) - Number(found.rating))/numberOfreviews;
            let toNumbers = product.reviews.map(review=>Number(review.rating));
            let newRating = toNumbers.reduce((tot,num)=>tot+num) / toNumbers.length;
            newRating = Math.round(newRating)
            console.log("rating",rating)
            console.log("product.rating",product.rating)
            console.log("found.rating",found.rating)
            console.log("newRating",newRating)
            console.log(product)
            product = await Product.findOneAndUpdate({ _id }, { reviews: product.reviews,rating:newRating }, {
                new: true
            });
            res.status(200).send({product,success:true, message:"Product has been deleted successfully"})
        } else {
            console.log("NOT FOUND !!")
            console.log(product,product.reviews.length)
            let numberOfreviews = product?.reviews.length;
            console.log("numberOfreviews",numberOfreviews);
            product.reviews.push({
                "rating":rating,
                userId,
                comment:[]
            });
            console.log(0,product.reviews)
            let toNumbers = product.reviews.map(review=>Number(review.rating));
            console.log(1,toNumbers)
            let newRating = (toNumbers.reduce((tot,num)=>tot+num)+rating) / (numberOfreviews+1);
            console.log(2,newRating)
            newRating = Math.round(newRating)
            console.log(3,newRating)

            // let newRating = (Number(rating)+ Number(product.rating))/numberOfreviews;
            // console.log("rating",rating)
            // console.log("product.rating",product.rating)
            // console.log("newRating",newRating)
            console.log(product)
            product = await Product.findOneAndUpdate({ _id }, { $addToSet: { reviews: [{userId,rating,comment:[]}] } }, {
                new: true
            });
            product = await Product.findOneAndUpdate({ _id }, {rating:newRating}, {
                new: true
            });
            res.status(200).send({product,success:true, message:"Product has been deleted successfully"})
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