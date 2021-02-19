const express = require('express');
const app = express();
const port = 3000;
require('./db-connection');

app.use(express.json());

app.use(express.static('public'))

const users = require('./routes/users');


app.use((req,res,next)=>{
    const requestDate = Date.now();
    console.log({method: req.method, URL: req.url, Time: requestDate});
    next()
})
// ------------ Routes -------------------------------------------------------------------------------

app.use('/api/users', users);


//----------------------------------------------------------------------------------------------------

app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).send('Something broke!')
})

app.listen(port,()=>{
    console.log(`Server is listening on http://localhost:${port}/`);
})
