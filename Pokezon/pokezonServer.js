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

/* RESULTS PAGE */
app.post("/results", async (request, response) => {

    const { pokemonName, color } = request.body;

    // Check which radio box is selected
    let isShiny = false;
    if (color === "shiny") {
        isShiny = true;
    }

    response.render("searchResults", variables);
});

/* CART */
app.get("/cart", async (request, response) => {

    try {
        await client.connect();

        const result = await client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .toArray();

        let cartItems = result.map(pokemon => {
            return `<tr><td>${pokemon.name}</td><td>${pokemon.weight}</td></tr>`;
        }).join('');

        let tableHTML = `<table border="1">
                                <thead>
                                    <tr>
                                        <th>Item</th><th>Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>${cartItems}</tr>
                                </tbody>
                            </table>
                            <br>`;

        const variables = {
            html: tableHTML
        };

        response.render("cart", variables);

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
});

