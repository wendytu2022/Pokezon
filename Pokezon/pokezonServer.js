process.stdin.setEncoding("utf8");
const path = require("path");
const express = require("express");
const app = express();
const portNumber = process.env.PORT;
//const portNumber = 4000;

/* mongo stuff */
require("dotenv").config({ path: path.resolve(__dirname, 'credentials/.env') })
const uri = process.env.MONGO_CONNECTION_STRING;

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

app.use(express.static(__dirname + '/styles'));

/* INDEX PAGE */
app.get("/", (request, response) => {
    response.render("index", { error: "" });
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
        let properties, items;

        properties = ""
        pokemonData.abilities.forEach(p => {if (p.ability.name) {
            properties += `<span id = "pink">${p.ability.name.replace('-', ' ')}</span>`}})

        items = ""
        pokemonData.held_items.forEach(p => {if (p.item.name) {
            items += `<span id = "pink">${p.item.name.replace('-', ' ')}</span>`}})

        if (shiny === "shiny" && pokemonData.sprites.front_shiny != "null") {
            pokemon = {
                name: pokemonData.name,
                image: pokemonData.sprites.front_shiny,
                imageBack: pokemonData.sprites.back_shiny,
                price: pokemonData.weight * 2,
                properties: properties,
                items: items
            }
        }
        else {
            pokemon = {
                name: pokemonData.name,
                image: pokemonData.sprites.front_default,
                imageBack: pokemonData.sprites.back_default,
                price: pokemonData.weight,
                properties: properties,
                items: items
            }
        }

        response.render("searchResults", pokemon);

    } catch (e) {
        console.error(e);
        response.render("index", { error: "Pokémon not found." });
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

        let cart = `<table>
                        <thead>
                            <tr>
                                <th>Item</th><th>Price</th>
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

// back
app.post("/back", async (request, response) => {
    response.redirect("/");
});

// clear cart
app.post("/clear", async (request, response) => {

    try {
        await client.connect();

        const cursor = await client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .find()
            .toArray();
        const count = cursor.length;

        const result = await client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .deleteMany({});

        response.redirect("cart");

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }

});

// continue shopping
app.post("/shop", async (request, response) => {
    response.redirect("/");
});

// checkout
app.post("/checkout", async (request, response) => {

    try {
        await client.connect();

        // gets list of pokemon
        const result = await client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .find()
            .toArray();

        let items = result.map(pokemon => {
            return `<tr><td>${pokemon.name}</td><td><img src=${pokemon.image} alt=${pokemon.name}></td></tr>`;
        }).join('');

        let cart = `<table border="1">
                        <thead>
                            <tr>
                                <th>Pokemon</th>
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

        // clears cart
        const cursor = await client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .find()
            .toArray();
        const count = cursor.length;

        await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).deleteMany({});

        response.render("checkout", variables);

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
