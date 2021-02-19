const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_DB || 'mongodb://localhost:27017/ecommerce', {
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    useFindAndModify:false,
    useCreateIndex:true
});