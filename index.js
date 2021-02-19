const express = require('express');
const methodOverride = require('method-override');
const app = express();
const port = 3000;
require('./db-connection');

app.use(express.json());

app.use(methodOverride('_method'))

app.use(express.static('public'))


const users = require('./routes/users');
const uploads = require('./routes/uploads');
const products = require('./routes/products');


app.use((req,res,next)=>{
    const requestDate = Date.now();
    console.log({method: req.method, URL: req.url, Time: requestDate});
    next()
})
// ------------ Routes -------------------------------------------------------------------------------

app.use('/api/users', users);
app.use('/api/images',uploads);
app.use('/api/products',products);

//----------------------------------------------------------------------------------------------------

app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).send('Something broke!')
})

app.listen(port,()=>{
    console.log(`Server is listening on http://localhost:${port}/`);
})
