const express = require("express");
const bodyParser = require("body-parser");
const pg = require("pg");
const env = require("dotenv").config();

const app = express();

const client = new pg.Client(process.env.URL)

client.connect(function(err){
    if(err){
        console.error('error connecting: ' + err);
    }
    else{
        console.log("Connected to database.");
    }
})

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.get("/api", (req, res) => {
    res.send("Api is working!");
})

app.get("/api/products", (req, res) => {
    const query = "SELECT * FROM products";
    client.query(query, (err, result) => {
        if (err) {
            console.error(err);
        }
        else {
            res.send(result.rows);
        }
    });
})

app.post("/api/products", (req, res) => {
    const values = [req.body.name, req.body.description, req.body.price];
    
    const query = "INSERT INTO products(name, description, price) VALUES ($1, $2, $3)";
    client.query(query, values, (err, result) => {
        if (err) {
            console.error(err);
            res.status(400).send(err.message);
        }
        else {
            res.status(201).send("Product added successfully!" + '\n' + JSON.stringify(req.body));
        }
    })
})

app.delete("/api/products/:id", (req, res) => {
    const id = req.params.id;
    const query = "DELETE FROM products WHERE id = $1";
    client.query(query, [id], (err, result) => {
        if (err) {
            console.error(err);
            res.status(400).send(err.message);
        }
        else if (result.rowCount === 0) {
            res.status(404).send("Product not found!");
        }
        else {
            res.status(200).send("Product deleted successfully!");
        }
    })
})

app.put("/api/products/:id", (req, res) => {
    const id = req.params.id;
    const updatedFields = {};

    if (req.body.name) {
        updatedFields.name = req.body.name;
    }
    if (req.body.description) {
        updatedFields.description = req.body.description;
    }
    if (req.body.price) {
        updatedFields.price = req.body.price;
    }

    if (Object.keys(updatedFields).length === 0) {
        res.status(400).send("No fields to update.");
        return;
    }

    const setClauses = Object.keys(updatedFields).map((key, index) => `${key} = $${index + 1}`).join(", ");
    const values = Object.values(updatedFields);
    values.push(id);

    const query = `UPDATE products SET ${setClauses} WHERE id = $${values.length}`;

    client.query(query, values, (err, result) => {
      if(err) {
        res.status(400).send(err.message);
      }  
      else if(result.rowCount === 0) {
        res.status(404).send("Product not found!");
      }
      else {
        res.status(200).send("Product updated successfully!");
      }
    })
})

app.listen(8000, () => {
    console.log("Server is running on port 8000.");
})