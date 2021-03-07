const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const orderSchema = Schema({
    userId:{type: Schema.Types.ObjectId, ref:'User'},
    // adminId:{type: Schema.Types.ObjectId, ref:'User'},
    products:[{
        productId:{type: Schema.Types.ObjectId, ref:'Product'},
        quantity:{type:Number, default:0},
    }],
    orderStatus:{
        type:String,
        default:'Pending',
        enum:['accepted','canceled','pending']
    },
    note:{
        type:String,
        default:""
    },
    address:{
        type:String
    },
    paymentMethod:{
        type:String,
        default:"in cash"
    }
},
{ timestamps: { createdAt: 'createdAt' } })

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;