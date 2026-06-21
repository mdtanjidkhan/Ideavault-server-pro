const express = require('express');
const app = express()
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
const PORT = process.env.PORT

const uri = process.env.MONGODB_SERVER_URL;

// ideaVault-db
// HFLWvmMlYVtgIKK1
// middleware
app.use(cors());
app.use(express.json());


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
)

// 
const verifyToken = async (req, res, next)=>{
   const authHeader = req?.headers.authorization
   if(!authHeader){
    return res.status(401).send({message:"Unauthorization"});
   }
   const token = authHeader.split(" ")[1]
   console.log(token)
    if(!token){
      return res.status(401).send({message: 'Unauthorized access'});
    }
    try{
        const {payload}= await jwtVerify(token, JWKS)
    console.log(payload);
     next();
    }catch(error){
      return res.status(403).send({message: 'Forbidden access'});
    }
}

async function run() {
  try {

    // await client.connect();

    const db = client.db("IdeaVault");
    const usersCollection = db.collection("users");
    const usersComment = db.collection("comments")

    // get idea page

    app.get('/users', async (req, res) => {
      const search = req.query.search;
      const category = req.query.category;
      let query = {};
      // category filter
      if (category) {
        query.category = category;
      }
      // 
      if (search) {
        query.title = {
          $regex: search,
          $options: "i",
        };
      }
      const cursor = usersCollection.find(query);
      const result = await cursor.toArray();
      // console.log(result);
      res.send(result)
    })
    // trending-ideas homepage limit jonno
    app.get('/trending-ideas', async (req, res) => {
      const result = await usersCollection.find().sort({ _id: -1 }).limit(6).toArray();
      res.send(result);
    })

    //  get comment 
    app.get('/comments', async (req, res) => {
      const result = await usersComment
        .find()
        .sort({ _id: -1 })
        .toArray();

      res.send(result);
    });

    // 

    //   patch comments
    app.patch('/comments/:id',verifyToken, async (req, res) => {
      const id = req.params.id
      const data = req.body;
      const filter = {
        _id: new ObjectId(id)
      }
      const updataDoc = {
        $set: {
          text: data.text
        }
      }
      const result = await usersComment.updateOne(filter, updataDoc);
      res.send(result);
    })

    // delete comment 
    app.delete('/comments/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id)
      }
      const result = await usersComment.deleteOne(query);
      res.send(result);
    })


    // comments jonno post methed

    app.post('/comments', verifyToken, async (req, res) => {
      const comment = req.body;
      const result = await usersComment.insertOne(comment);
      //  console.log("comments data",result);
      res.send({
        _id: result.insertedId,
        ...comment
      });
    })
     
    //  User Profile Update korar route 
app.patch('/user-update/:email',verifyToken, async (req, res) => {
  const email = req.params.email;
  const filter = { userEmail: email }; 
  const updatedDoc = {
    $set: {
      name: req.body.name,
    }
  };
  const result = await usersCollection.updateMany(filter, updatedDoc); 
  res.send(result);
});
   
    //  get params id

    app.get('/users/:id',verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id)
      };
      const result = await usersCollection.findOne(query);
      // console.log(result)
      res.send(result);
    })

    // my-ideas page 
    app.get('/my-ideas/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });
    //  my-interactions
  app.get('/my-interactions/:email', async(req, res)=>{
    const email = req.params.email;
    const query ={
      userEmail:  email
    };
    const result = await usersCollection.find(query).toArray();
    res.send(result);
  })

    app.patch('/ideas/:id', verifyToken, async (req, res) => {
      const filter = { _id: new ObjectId(req.params.id) };
      const updatedDoc = { $set: req.body };
      const result = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });


    // delete
    app.delete('/ideas/:id', verifyToken, async (req, res) => {
      const result = await usersCollection.deleteOne({ _id: new ObjectId(req.params.id) });
      res.send(result);
    });

    // post 
    app.post('/users', verifyToken, async (req, res) => {
      const users = req.body;
      const result = await usersCollection.insertOne(users);
      // console.log(result);
      res.send(result);
    })



    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})