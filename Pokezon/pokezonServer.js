process.stdin.setEncoding("utf8");
const path = require("path");
const express = require("express");
const app = express();

/* mongo stuff */
require("dotenv").config({ path: path.resolve(__dirname, 'credentials/.env') })
const uri = process.env.MONGO_CONNECTION_STRING;

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

/* INDEX PAGE */
app.get("/", (request, response) => {
    response.render("index");
});

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
const { MongoClient, ServerApiVersion } = require('mongodb');
const databaseAndCollection = { db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION };
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

/* CART */
app.get("/cart", async (request, response) => {

    try {
        await client.connect();

        const result = await client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .toArray();

        let list = `<li>Pikachu</li>`;

        const variables = {
            list: list
        };

        response.render("cart", variables);

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
});

