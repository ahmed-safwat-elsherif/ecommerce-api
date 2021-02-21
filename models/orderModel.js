const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const orderSchema = Schema({
    userId:{type: Schema.Types.ObjectId, ref:'User'},
    adminId:{type: Schema.Types.ObjectId, ref:'Product'},
    products:[{
        productId:{type: Schema.Types.ObjectId, ref:'Product'},
        quantity:{type:Number, default:0},
    }],
    status:{
        type:String,
        default:'Pending',
        enum:['Accepted','Canceled','Pending']
    },
    note:{
        type:String
    },
    address:{
        type:String
    }
},
{ timestamps: { createdAt: 'createdAt' } })

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;