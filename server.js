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
    res.render('addItem')
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

app.use(function(req, res, next) {
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});

const hbs = exphbs.create({
    extname: '.hbs',
    helpers: {
        navLink: function(url, options) {
            let activeClass = (url === app.locals.activeRoute) ? 'active' : '';
            return `<li class="${activeClass}"><a href="${url}">${options.fn(this)}</a></li>`;
        },
        equal: function(lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }
    }
});

app.engine('hbs', hbs.engine);

// Redirect root route ("/") to "/about"
app.get("/", (req, res) => {
    console.log("Redirecting / to /shop");
    res.redirect("/shop");
});

// Serve about.html when visiting "/about"
app.get("/about", (req, res) => {
    console.log("GET /about request received");
    res.render("about");
});

// Route for "/shop" to return published items
/*
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
*/
app.get("/shop", async (req, res) => {
    // Declare an object to store properties for the view
    let viewData = {};
  
    try {
      // declare empty array to hold "item" objects
      let items = [];
  
      // if there's a "category" query, filter the returned items by category
      if (req.query.category) {
        // Obtain the published "item" by category
        items = await itemData.getPublishedItemsByCategory(req.query.category);
      } else {
        // Obtain the published "items"
        items = await itemData.getPublishedItems();
      }
  
      // sort the published items by itemDate
      items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));
  
      // get the latest item from the front of the list (element 0)
      let item = items[0];
  
      // store the "items" and "item" data in the viewData object (to be passed to the view)
      viewData.items = items;
      viewData.item = item;
    } catch (err) {
      viewData.message = "no results";
    }
  
    try {
      // Obtain the full list of "categories"
      let categories = await itemData.getCategories();
  
      // store the "categories" data in the viewData object (to be passed to the view)
      viewData.categories = categories;
    } catch (err) {
      viewData.categoriesMessage = "no results";
    }
  
    // render the "shop" view with all of the data (viewData)
    res.render("shop", { data: viewData });
  });

app.get('/items', (req, res) => {
    console.log("GET /items request received");

    // Extract query parameters
    const { category, minDate } = req.query;

    if (category) {
        // Use the new function to fetch published items filtered by category
        storeService.getPublishedItemsByCategory(category)
            .then((filteredItems) => {
                console.log(`Sending ${filteredItems.length} items for category ${category}`);
                
                // Render the 'items' template and pass the filtered items
                res.render("items", { items: filteredItems });
            })
            .catch((err) => {
                console.error("Error fetching items by category:", err);
                // Render an error message on the items page itself
                res.render("items", { message: "Error fetching items by category" });
            });
    
    } else if (minDate) {
        storeService.getItemsByMinDate(minDate)
            .then((filteredItems) => {
                console.log(`Sending ${filteredItems.length} items with postDate >= ${minDate}`);
                // Render the 'items' template and pass the filtered items
                res.render("items", { items: filteredItems });
            })
            .catch((err) => {
                console.error("Error fetching items by minDate:", err);
                // Render an error message on the items page itself
                res.render("items", { message: "Error fetching items by date" });
            });
    } else {
        // Fetch all items if no filter is provided
        storeService.getAllItems()
            .then((allItems) => {
                console.log(`Sending ${allItems.length} items`);
                // Render the 'items' template and pass the items
                res.render("items", { items: allItems });
            })
            .catch((err) => {
                console.error("Error fetching all items:", err);
                // Render an error message on the items page itself
                res.render("items", { message: "Error fetching items" });
            });
    }
});

// Route for "/categories" to return all categories
app.get('/categories', (req, res) => {
    console.log("GET /categories request received");

    // Fetch categories from the storeService
    storeService.getCategories()
        .then((categories) => {
            // If categories are fetched successfully, render the "categories" template and pass the categories to it
            console.log(`Sending ${categories.length} categories`);
            res.render("categories", { categories: categories });
        })
        .catch((err) => {
            // If there is an error fetching categories, render the "categories" template with an error message
            console.error("Error fetching categories:", err);
            res.render("categories", { message: "No results" });
        });
});

// Route for Shop Id
app.get('/shop/:id', async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = {};
  
    try{
  
        // declare empty array to hold "item" objects
        let items = [];
  
        // if there's a "category" query, filter the returned items by category
        if(req.query.category){
            // Obtain the published "items" by category
            items = await itemData.getPublishedItemsByCategory(req.query.category);
        }else{
            // Obtain the published "items"
            items = await itemData.getPublishedItems();
        }
  
        // sort the published items by itemDate
        items.sort((a,b) => new Date(b.itemDate) - new Date(a.itemDate));
  
        // store the "items" and "item" data in the viewData object (to be passed to the view)
        viewData.items = items;
  
    }catch(err){
        viewData.message = "no results";
    }
  
    try{
        // Obtain the item by "id"
        viewData.item = await itemData.getItemById(req.params.id);
    }catch(err){
        viewData.message = "no results"; 
    }
  
    try{
        // Obtain the full list of "categories"
        let categories = await itemData.getCategories();
  
        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results"
    }
  
    // render the "shop" view with all of the data (viewData)
    res.render("shop", {data: viewData})
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