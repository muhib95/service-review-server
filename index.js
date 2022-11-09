const express = require('express')
const cors = require('cors')
const jwt=require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express()
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.c8jqjnz.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
function varifyJWT(req,res,next){
  const authHeader=req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({message:'unauthorize'});
  }
  const token=authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRETE, function(err, decoded) {
    if(err){
      return res.status(401).send({message:'unauthorize'});
    }
    req.decoded=decoded;
    next();
  });


}
async function run() {
   try{
    const productsCollection=client.db("dental-care").collection("services")
    const reviewCollection=client.db("dental-care").collection("reviews")
    app.post('/jwt',(req,res)=>{
      const user=req.body;
      const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRETE,{expiresIn:'10h'})
      res.send({token})

    })  

    app.get('/',async(req,res)=>{
        const query={};
        const cursor=productsCollection.find(query);
        const count=await productsCollection.estimatedDocumentCount();
        const products=await cursor.skip(count-3).limit(3).toArray();
        res.send(products);

    })
    app.get('/services',async(req,res)=>{
        const query={};
        const cursor=productsCollection.find(query);
        const products=await cursor.toArray();
        res.send(products);

    })
    app.get('/servicesdetails/:id',async(req,res)=>{
        const id=req.params.id;
        const query={_id:ObjectId(id)};
        const cursor=productsCollection.find(query);
        const product=await cursor.toArray();
        res.send(product);

    })
    app.post('/service',async(req,res)=>{
        const service=req.body;
        const result=await productsCollection.insertOne(service);
        res.send(result)
   })
   app.post('/review',async(req,res)=>{
    const review=req.body;
    const result=await reviewCollection.insertOne(review);
    res.send(result)
})

app.get('/reviews',async(req,res)=>{
  const a=req.query.id;
  let query={};
  if(req.query.id){
    query={
      serviceID:req.query.id

    };
    const cursor=reviewCollection.find(query).sort({_id:-1});
        const reviews=await cursor.toArray();
        res.send(reviews);

  }
})

app.get('/myreviews',varifyJWT, async(req,res)=>{
  const decoded=req.decoded;
  if(decoded.email!==req.query.email){
    return res.status(403).send({message:'unauthorize'});
  }
  let query={};
  if(req.query.email){
    query = { email: req.query.email };

  }
  const cursor=reviewCollection.find(query).sort({_id:-1});
        const reviews=await cursor.toArray();
        res.send(reviews);



})
app.put('/reviews/:id',async(req,res)=>{
  const id=req.params.id;
  const filter={_id:ObjectId(id)}
  const reviewUpdate=req.body;
  const options = { upsert: true };
    const updateDoc = {
$set: {
  review:reviewUpdate.review
},

};
const result = await reviewCollection.updateOne(filter, updateDoc, options);

  res.send(result);

})
app.delete('/reviews/:id',async(req,res)=>{
  const id=req.params.id;
  const query={_id:ObjectId(id)};
  const result=await reviewCollection.deleteOne(query);
  res.send(result)

})
app.get('/updateproduct/:id',async(req,res)=>{
  const id=req.params.id;
  const query={_id:ObjectId(id)};
  // const cursor=reviewCollection.find(query);
  // const product=await cursor.toArray();
  const cursor=await reviewCollection.findOne(query);
  res.send(cursor);

})
   

   }
   finally{

   }
  }
  run().catch(console.dir);
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})