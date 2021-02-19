const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const userSchema = Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        minlength:5,
        validate:/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g
    },
    password: {
        type: String,
        required: true
    },
    confirmation:{
        type:Boolean,
        default:false
    },
    firstname: {
        type: String,
        minlength: 3,
        maxlength: 50
    },
    lastname: {
        type: String,
        minlength: 3,
        maxlength: 50
    },
    todoId:[{type: Schema.Types.ObjectId, ref:'Todo'}],
    todoGroupId:[{type: Schema.Types.ObjectId, ref:'TodoGroup'}]
},
{ timestamps: { createdAt: 'createdAt' } })

const User = mongoose.model('User', userSchema);

module.exports = User