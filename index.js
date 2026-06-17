const express = require('express');
const app = express()
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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

async function run() {
  try {
    
    await client.connect();
     
    const db = client.db("IdeaVault");
    const usersCollection = db.collection("users");
    const usersComment = db.collection("comments")

    // get 

    app.get('/users', async(req,res)=>{
      const search = req.query.search;
      const category = req.query.category;
      let query = {};
      // category filter
      if(category){
        query.category = category;
      }
      // 
      if(search){
        query.title ={
          $regex: search,
          $options: "i",
        };
      }
      const cursor = usersCollection.find(query);
      const result = await cursor.toArray();
      // console.log(result);
      res.send(result)
    })

    //  get 
    app.get('/comments', async (req, res) => {
   const result = await usersComment
      .find()
      .sort({ _id: -1 })
      .toArray();

   res.send(result);
});

//   patch 
 app.patch('/comments/:id', async(req,res)=>{
   const id = req.params.id
   const updateData = req.body;
   const filter ={
    _id: new ObjectId(id)
   }
   const result = await usersComment.updateOne(filter,{$set:updateData});
   console.log(result)
   res.send(result);
 })



// delete 



    // comments jonno post methed
   
   app.post('/comments', async(req,res)=>{
    const data = req.body;
    if (data && typeof data.text === 'object' && data.text !== null) {
      data.text = data.text.comments || ""; 
    }
     const comment = {
    ...data,
    createdAt: new Date(),
  };
     const result = await usersComment.insertOne(comment);
    //  console.log("comments data",result);
     res.send({
       _id: result.insertedId,
      ...comment
     });

   })
    

    //  get params id
    
    app.get('/users/:id', async(req,res)=>{
        const id = req.params.id;
        const query={
          _id: new ObjectId(id)
        };
        const result = await usersCollection.findOne(query);
        // console.log(result)
        res.send(result);
    })

    // post 
    app.post('/users', async(req, res)=>{
        const users = req.body;
        const result = await usersCollection.insertOne(users);
        // console.log(result);
        res.send(result);
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
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