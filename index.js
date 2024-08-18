const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ll6idae.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const productsCollection = client.db("ecommerce").collection("products");

    // Pagination and Filtering
    app.get("/allproducts", async (req, res) => {
      const { page = 1, limit = 10, search = '', category, minPrice, maxPrice, sort } = req.query;
      const query = {};
      
      if (search) {
        query.productName = { $regex: search, $options: "i" };
      }
      if (category) {
        query.category = category;
      }
      if (minPrice && maxPrice) {
        query.price = { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) };
      }

      const options = {};
      if (sort === 'priceLowToHigh') {
        options.sort = { price: 1 };
      } else if (sort === 'priceHighToLow') {
        options.sort = { price: -1 };
      } else if (sort === 'newest') {
        options.sort = { creationDateTime: -1 };
      }

      const totalProducts = await productsCollection.countDocuments(query);
      const totalPages = Math.ceil(totalProducts / limit);

      const products = await productsCollection
        .find(query, options)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .toArray();

      res.send({ products, totalPages });
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hey from Ecommerce Server");
});

app.listen(port, () => console.log(`Ecommerce Server is running on Port ${port}`));
