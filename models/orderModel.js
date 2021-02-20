const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const orderSchema = Schema({
    userId:{type: Schema.Types.ObjectId, ref:'Product'},
    adminId:{type: Schema.Types.ObjectId, ref:'Product'},
    products:[{
        pID:{type: Schema.Types.ObjectId, ref:'Product'},
        quantity:{type:Number, default:0},
    }],
    status:{
        type:String,
        default:'pending',
        enum:['accepted','rejected','pending']
    }
    
},
{ timestamps: { createdAt: 'createdAt' } })

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;