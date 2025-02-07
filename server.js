/*********************************************************************************

WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Yonathan Tsegaye
Student ID: ______________ 
Date: 01/29/2025
Cyclic Web App URL: _______________________________________________________
GitHub Repository URL: ______________________________________________________

********************************************************************************/ 

const storeService = require('./store-service.js');  // Ensure the correct path
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Redirect root route ("/") to "/about"
app.get("/", (req, res) => {
    console.log("Redirecting / to /about");
    res.redirect("/about");
});

// Serve about.html when visiting "/about"
app.get("/about", (req, res) => {
    console.log("GET /about request received");
    res.sendFile(path.join(__dirname, "views", "about.html"));
});

// Route for "/shop" to return published items
app.get('/shop', (req, res) => {
    console.log("GET /shop request received");
    storeService.getPublishedItems()
        .then((publishedItems) => {
            console.log(`Sending ${publishedItems.length} published items`);
            res.json(publishedItems);
        })
        .catch((err) => {
            console.error("Error fetching published items:", err);
            res.status(500).json({ message: err });
        });
});

// Route for "/items" to return all items
app.get('/items', (req, res) => {
    console.log("GET /items request received");
    storeService.getAllItems()
        .then((allItems) => {
            console.log(`Sending ${allItems.length} items`);
            res.json(allItems);
        })
        .catch((err) => {
            console.error("Error fetching all items:", err);
            res.status(500).json({ message: err });
        });
});

// Route for "/categories" to return all categories
app.get('/categories', (req, res) => {
    console.log("GET /categories request received");
    storeService.getCategories()
        .then((categories) => {
            console.log(`Sending ${categories.length} categories`);
            res.json(categories);
        })
        .catch((err) => {
            console.error("Error fetching categories:", err);
            res.status(500).json({ message: err });
        });
});

// Handle unmatched routes
app.use((req, res) => {
    console.log(`404 Not Found: ${req.originalUrl}`);
    res.status(404).send("Page Not Found");
});

// Start the server after initializing the store service
storeService.initialize()
    .then(() => {
        console.log("Store service initialized successfully.");
        app.listen(PORT, () => {
            console.log(`Express HTTP server listening on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Error initializing store service:", err);
    });