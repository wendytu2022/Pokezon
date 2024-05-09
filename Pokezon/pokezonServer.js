process.stdin.setEncoding("utf8");
const path = require("path");
const express = require("express");
const app = express();
const portNumber = process.env.PORT;

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

        let items = result.map(pokemon => {
            return `<tr><td>${pokemon.name}</td><td>${pokemon.weight}</td></tr>`;
        }).join('');

        let cart = `<table>
                        <thead>
                            <tr>
                                <th>Item</th><th>Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>${items}</tr>
                        </tbody>
                    </table>
                    <br>`;


        const variables = {
            html: cart
        };

        response.render("cart", variables);

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
});

app.listen(portNumber);
console.log(`Web server started and running at: http://localhost:${portNumber}`);
const prompt = "Stop to shutdown the server: ";
process.stdout.write(prompt);
// Read input until exit
process.stdin.on("readable", function () {
    const input = process.stdin.read();
    if (input !== null) {
        const command = input.trim();

        // if user entered "stop", exits
        if (command === "stop") {
            process.stdout.write("Shutting down the server");
            process.exit(0);
        }
        // if user did not enter any of the above, tells them 
        // that they gave an invalid command
        else {
            process.stdout.write(`Invalid command: ${command} \n`);
        }
        process.stdout.write(prompt);
        process.stdin.resume();
    }
});
