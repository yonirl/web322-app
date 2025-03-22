/*********************************************************************************

WEB322 – Assignment 04
I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Yonathan Tsegaye
Student ID: 147314231
Date: 03/16/2025
Replit Web App URL: https://replit.com/@ytsegaye1/web322-app
GitHub Repository URL: https://github.com/yonirl/web322-app

********************************************************************************/ 

const storeService = require('./store-service.js'); 
const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 8080;
const multer = require("multer");
const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier');
const exphbs = require('express-handlebars');

app.engine('hbs', exphbs.engine({
    extname: '.hbs',  
  }));

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

cloudinary.config({
    cloud_name: 'dlxifcpza',
    api_key: '486225466241532',
    api_secret: 'IsYtpn3gA3JihPWFTee__ca0n5I',
    secure: true
});

const upload = multer({
    limits: {filesize: 10 * 1024 * 1024}
});

app.engine('hbs', exphbs.engine({
    extname: '.hbs',  
}));

app.set('view engine', 'hbs');

app.get("/items/add", (req, res) => {  
    res.sendFile(path.join(__dirname, "views", "addItem.html"));  
});

app.get('/item/:id', (req, res) => {
    console.log(`GET /item/${req.params.id} request received`);

    const itemId = req.params.id;

    // Call getItemById in store service
    storeService.getItemById(itemId) 
        .then((item) => {
            console.log(`Sending item with ID: ${itemId}`);
            res.json(item);  // Send the item as JSON
        })
        .catch((err) => {
            console.error("Error fetching item by ID:", err);
            res.status(404).json({ message: `Item with ID ${itemId} not found` });
        });
});

// Route for file upload handling
app.post("/upload", upload.single("image"), (req, res) => {
    console.log("File upload request received");

    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    let stream = cloudinary.uploader.upload_stream((error, result) => {
        if (error) {
            console.error("Upload Error:", error);
            return res.status(500).json({ error: "Upload failed" });
        }

        console.log("File uploaded successfully:", result.secure_url);
        res.json({ imageUrl: result.secure_url }); // Return the uploaded image URL
    });

    streamifier.createReadStream(req.file.buffer).pipe(stream);
});

// Route to Handle Adding a New Item
app.post("/items/add", upload.single("featureImage"), (req, res) => {
    console.log("POST /items/add request received");

    if (req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );

                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        async function upload(req) {
            let result = await streamUpload(req);
            console.log("Uploaded Image URL:", result.url);
            return result;
        }

        upload(req).then((uploaded) => {
            processItem(uploaded.url);
        }).catch((err) => {
            console.error("Image upload failed:", err);
            res.status(500).json({ error: "Image upload failed" });
        });

    } else {
        processItem("");
    }

    function processItem(imageUrl) {
        req.body.featureImage = imageUrl;

        storeService.addItem(req.body)
            .then(() => {
                console.log("Item added successfully!");
                res.redirect("/items");
            })
            .catch((err) => {
                console.error("Error adding item:", err);
                res.status(500).json({ message: "Failed to add item" });
            });
    }
});

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

    // Extract query parameters
    const { category, minDate } = req.query;

    if (category) {
        storeService.getItemsByCategory(category)
            .then((filteredItems) => {
                console.log(`Sending ${filteredItems.length} items for category ${category}`);
                res.json(filteredItems);
            })
            .catch((err) => {
                console.error("Error fetching items by category:", err);
                res.status(500).json({ message: err });
            });
    } else if (minDate) {
        storeService.getItemsByMinDate(minDate)
            .then((filteredItems) => {
                console.log(`Sending ${filteredItems.length} items with postDate >= ${minDate}`);
                res.json(filteredItems);
            })
            .catch((err) => {
                console.error("Error fetching items by minDate:", err);
                res.status(500).json({ message: err });
            });
    } else {
        storeService.getAllItems()
            .then((allItems) => {
                console.log(`Sending ${allItems.length} items`);
                res.json(allItems);
            })
            .catch((err) => {
                console.error("Error fetching all items:", err);
                res.status(500).json({ message: err });
            });
    }
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