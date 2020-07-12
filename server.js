const express = require('express');
const bodyParser = require('body-parser');
const bycrypt = require('bcrypt-nodejs');
const cors = require('cors');
const db = require('knex')({
    client: 'pg',
    connection: {
      connectString : process.env.DATABASE_URL,
      ssl:true
    }
  });
db.select('*').from('users').then(data=>{
    console.log(data);
});

const app = express();

app.use(bodyParser.json());
app.use(cors());
const database = {
    users:[
        {
            id:'123',
            name:'john',
            email:'john@gmail.com',
            passowrd:'cookies',
            entries:0,
            joined:new Date()
        },
        {
            id:'124',
            name:'rabin',
            email:'rabin@gmail.com',
            passowrd:'rabin',
            entries:0,
            joined:new Date()
        }
    ]
}
app.get('/',(req,res)=>{
    res.send('it is working');
})
app.post('/signin',(req,res)=>{
    db.select('email','hash').from('login')
    .where('email','=',req.body.email)
    .then(data =>{
        const isValid = bycrypt.compareSync(req.body.password,data[0].hash);
        console.log(isValid);
        if(isValid){
                return db.select('*').from('users')
                .where('email','=',req.body.email)
                .then(user=>{
                    console.log(user);
                    res.json(user[0])
                })
                .catch (err=> res.status(400).json('unable to get user'));
        }else{
            res.status(400).json('wrong input1');
        }
    })
    .catch(err=>res.status(400).json('wrong input2'))
})
app.post('/register',(req,res)=>{
    const { email , name, password} = req.body;
    const hash = bycrypt.hashSync(password);
    db.transaction(trx=>{
        trx.insert({
            hash:hash,
            email:email
        })
        .into('login')
        .returning('email')
        .then(loginEmail=>{
            return trx('users')
            .returning('*')
            .insert({
                email:loginEmail[0],
                name:name,
                joined:new Date()
            })
            .then(user=>{
                res.json(user[0]);
            })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
    .catch(err=>res.status(400).json("unable to register"));
    
})
app.get('/profile/:id',(req,res)=>{
    const { id } = req.params;
    db.select('*').from('users').where({
        id:id
    })
    .then(user=>{
        if(user.length){
            res.json(user[0]);
        }else{
            res.status(400).json('not found')
        }
    })
    .catch(err=>res.status(400).json('error getting user'))
    //if(!found){
      //  res.status(400).json('not found');
    //}
})
app.put('/image',(req,res)=>{
    const { id } = req.body;
    db('users').where('id','=',id)
    .increment('entries',1)
    .returning('entries')
    .then(entries=>{
        res.json(entries[0]);
    })
    .catch(err=>res.status(400).json('unable to get entries'))
})
app.listen(process.env.PORT|| 3000,()=>{
    console.log(`app is running in port ${process.env.PORT}`);
})
