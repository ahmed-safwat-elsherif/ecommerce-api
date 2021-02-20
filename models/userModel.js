const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const userSchema = Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        minlength:5
    },
    password: {
        type: String,
        required: true,
        minlength:8
    },
    gender:{
        type:String,
        required:true,
        enum:['male','female']
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
    addresses:[{
        type:String,
        minlength:3
    }],
    profileImage:{
        type:String
    },
    phones:[{
        type:String,
        validate:/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/g
    }],
    favoriteProducts:[{type: Schema.Types.ObjectId, ref:'Product'}],
    isAdmin:{
        type:Boolean,
        default:false
    }
},
{ timestamps: { createdAt: 'createdAt' } })

const User = mongoose.model('User', userSchema);

module.exports = User