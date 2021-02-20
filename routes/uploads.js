const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const config = require('../config/config');
const crypto = require('crypto');
const path = require('path')
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const User= require('../models/userModel')
const Image= require('../models/imageModel')
const ImageChunk= require('../models/imageChunkModel')
const Product= require('../models/productModel')
const connection = require('../db-connection');
const { authenticate, adminAuthenticate } = require('../auth/user');


const storage = new GridFsStorage({
    url: config.mongoURL,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
          crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
        }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
        };
        resolve(fileInfo);
    });
});
}
})
const upload = multer({ storage });
let gfs;
connection.once('open',()=>{
    gfs = Grid(connection.db,mongoose.mongo)
    gfs.collection('uploads')
});

// POST the profile image
router.post('/user/',authenticate,upload.single('image'), async(req,res)=>{
    let {filename} = req.file;
    let {_id}= req.signData;
    let image = await Image.findOne({filename:req.file.filename});
    let date = new Date(image.uploadDate)
    console.log('TIME NOW: ',date.getHours()-12,':',date.getMinutes())
    // await User.findOneAndUpdate({_id},{profileImage:filename},{
    //     new: true
    // }).exec();
    res.redirect('/');
})

// POST the product image
router.post('/product/:_id',upload.single('image'), async(req,res)=>{
    let {filename} = req.file;
    let {_id}= req.params;
    let image = await Image.findOne({filename:req.file.filename});
    let date = new Date(image.uploadDate)
    console.log('TIME NOW: ',date.getHours()-12,':',date.getMinutes())
    await Product.findOneAndUpdate({_id},{profileImage:filename},{
        new: true
    }).exec();
    res.redirect('/');
})

//To get and show any image
router.get('/show/:filename',(req,res)=>{
    console.log(req.params.filename)
    gfs.files.find({filename:req.params.filename}).toArray((err,file)=>{
        console.log(file[0])
        if(!file[0] || file[0].length===0){
            return res.status(404).send({err:'No file exists'})
        }
        if(file[0].contentType==='image/jpeg' || file[0].contentType === 'img/png'){
            // read output
            const readstream = gfs.createReadStream(file[0].filename);
            readstream.pipe(res)
        } else {
            res.status(404).send({err:'No and image'})
        }
    })
})

router.delete('/delete/:_id',(req,res)=>{
    let {_id} = req.params;
    gfs.remove({_id,root:'uploads'},(err,gridStore)=>{
        if(err){
            return res.status(404).send({err})
        }
        res.status(200).send({success:true, message:"Image was deleted successfully"})
    })
})





module.exports = router;