process.stdin.setEncoding("utf8");
const path = require("path");
const express = require("express");
const app = express();
const portNumber = process.env.PORT;
//const portNumber = 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* mongo stuff */
require("dotenv").config({ path: path.resolve(__dirname, 'credentials/.env') })
const uri = process.env.MONGO_CONNECTION_STRING;

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

app.use(express.static(__dirname + '/styles'));

/* INDEX PAGE */
app.get("/", (request, response) => {
    response.render("index");
});

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
const { MongoClient, ServerApiVersion } = require('mongodb');
const databaseAndCollection = { db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION };
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

app.post("/searchResults", async (request, response) => {

    let pokemonName = request.body.pokemonName;
    let shiny = request.body.color;
    pokemonName = pokemonName.toLowerCase();
    let pokemon;

    try {

        const apiResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
        const pokemonData = await apiResponse.json();
        let properties;

        console.log(pokemonData.abilities)
        properties = pokemonData.abilities[0].ability.name
        if (shiny === "shiny" && pokemonData.sprites.front_shiny != "null") {
            pokemon = {
                name: pokemonData.name,
                image: pokemonData.sprites.front_shiny,
                price: pokemonData.weight * 2,
                properties: properties
            }
        }
        else {
            pokemon = {
                name: pokemonData.name,
                image: pokemonData.sprites.front_default,
                price: pokemonData.weight,
                properties: properties
            }
        }

        response.render("searchResults", pokemon);

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
});

/* CART */
app.get("/cart", async (request, response) => {

    try {
        await client.connect();

        const result = await client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .find()
            .toArray();

        let items = result.map(pokemon => {
            return `<tr><td>${pokemon.name}</td><td>${pokemon.price}</td><td><img src=${pokemon.image} alt=${pokemon.name}></td></tr>`;
        }).join('');

        let total = result.reduce((sum, pokemon) => {
            return sum + parseInt(pokemon.price);
        }, 0);

        let cart = `<table border="1">
                        <thead>
                            <tr>
                                <th>Item</th><th>Price</th><th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>${items}</tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td>Total Cost: </td>
                                <td>${total.toFixed(2)}</td>
                            </tr>
                        </tfoot>
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

/* add to cart */
app.post("/cart", async (request, response) => {

    let pokemonName = request.body.pokemonName;
    let image = request.body.image;
    let price = request.body.price;

    try {
        await client.connect();

        let pokemon = {
            name: pokemonName,
            image: image,
            price: price
        }        
        
        await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(pokemon);
        
        response.redirect("cart")

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
