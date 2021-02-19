const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const productSchema = Schema({
    name:{
        type:String,
        required:true,
        minlength:3
    },
    current_price:{
        type:Number,
        default:0,
    },
    old_price:{
        type:Number,
        default:0,
    },
    status:{
        type:String,
        default:'normal',
        enum:['Sale','Out of stock','normal']
    },
    rating:{
        type:Number,
        default:0
    },
    image:{
        type:String
    },
    reviews:[{
        userId:{
            type: Schema.Types.ObjectId, ref:'User',
            required:true
        },
        rating:{
            type:Number,
            required:true
        }
    }],
    description:{
        type:String,
        required:true
    }
},
{ timestamps: { createdAt: 'createdAt' } })

const Product = mongoose.model('Product', productSchema);

module.exports = Product