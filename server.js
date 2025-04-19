/*********************************************************************************

WEB322 – Assignment 06
I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Yonathan Tsegaye
Student ID: 147314231
Date: 04/10/2025
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
const authData = require("./auth-service.js");
const clientSessions = require('client-sessions');
const HTTP_PORT = process.env.PORT || 8080;

// Add middleware to parse form data
app.use(express.urlencoded({ extended: true }));

function ensureLogin(req, res, next) {
  if (!req.session.userName) {
    res.redirect('/login');
  } else {
    next();
  }
}

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

app.use(clientSessions({
  cookieName: 'session',  // Cookie name to store the session data
  secret: 'o6LjQ5EVNC28ZgK64hDELM18ScpFQr',  // Secret key used for encryption (change to a strong secret)
  duration: 2 * 60 * 1000,  
  activeDuration: 1000 * 60,  
}));

// Add user session data to views
app.use(function(req, res, next) {
  res.locals.session = req.session;
  next();
});

// GET /login route
app.get('/login', (req, res) => {
  res.render('login');
});

// GET /register route
app.get('/register', (req, res) => {
  res.render('register'); 
});

// GET /userHistory route - protected by ensureLogin middleware
app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory", { user: req.session.user });
});

// POST /register route
app.post('/register', (req, res) => {
  authData.registerUser(req.body)
    .then(() => {
      res.render('register', { successMessage: "User created" });
    })
    .catch((err) => {
      res.render('register', { errorMessage: err, userName: req.body.userName });
    });
});

// POST /login route
app.post('/login', (req, res) => {
  req.body.userAgent = req.get('User-Agent');
  
  authData.checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory
      };
      res.redirect('/items');
    })
    .catch((err) => {
      res.render('login', { errorMessage: err, userName: req.body.userName });
    });
});

// GET /logout route
app.get('/logout', (req, res) => {
  req.session.reset();
  res.redirect('/');
});

app.get("/items/add", ensureLogin, async (req, res) => {
    try {
        const categories = await storeService.getCategories();
        
        res.render("addPost", { categories: categories });
    } catch (err) {
        res.render("addPost", { categories: [] });
    }
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
app.post("/items/add", ensureLogin, upload.single("featureImage"), (req, res) => {
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
      navLink: function (url, options) {
        let activeClass = (url === app.locals.activeRoute) ? 'active' : '';
        return `<li class="${activeClass}"><a href="${url}">${options.fn(this)}</a></li>`;
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper 'equal' needs 2 parameters");
        return lvalue != rvalue ? options.inverse(this) : options.fn(this);
      },
      safeHTML: function (context) {
        return new hbs.handlebars.SafeString(context);
      },
      formatDate: function(dateObj) {
        let year = dateObj.getFullYear();
        let month = (dateObj.getMonth() + 1).toString();
        let day = dateObj.getDate().toString();
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2,'0')}`;
      }
    }
  });
  
  app.engine('hbs', hbs.engine);
  app.set('view engine', 'hbs');
  
  app.get('/items/delete/:id', ensureLogin, (req, res) => {
    const postId = req.params.id;
    storeService.deletePostById(postId)
        .then(() => {
            res.redirect('/items');
        })
        .catch((err) => {
            // If an error occurs, return a 500 status code and the error message
            res.status(500).send('Unable to Remove Post / Post not found');
        });
});

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

app.get("/shop", async (req, res) => {
    let viewData = {};
  
    try {
      let items = [];
  
      if (req.query.category) {
        items = await storeService.getPublishedItemsByCategory(req.query.category);
      } else {
        items = await storeService.getPublishedItems();
      }

      items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
      let item = items[0];
  
      viewData.items = items;
      viewData.item = item;
    } catch (err) {
      viewData.message = "no results";
    }
  
    try {
      let categories = await storeService.getCategories();
      viewData.categories = categories;
    } catch (err) {
      viewData.categoriesMessage = "no results";
    }
  
    res.render("shop", { data: viewData });
  });
  
  app.get('/shop/:id', async (req, res) => {
    // Declare an object to store properties for the view
    let viewData = {};
    try {
      // declare empty array to hold "item" objects
      let items = [];
      // if there's a "category" query, filter the returned items by category
      if (req.query.category) {
        // Obtain the published "items" by category
        items = await storeService.getPublishedItemsByCategory(req.query.category);
      } else {
        // Obtain the published "items"
        items = await storeService.getPublishedItems();
      }
      // sort the published items by itemDate
      items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));
      // store the "items" in the viewData object
      viewData.items = items;
    } catch (err) {
      viewData.message = "no results";
    }
  
    try {
      // Obtain the item by "id"
      viewData.item = await itemData.getItemById(req.params.id);
    } catch (err) {
      viewData.message = "no results";
    }
  
    try {
      // Obtain the full list of "categories"
      let categories = await itemData.getCategories();
      viewData.categories = categories;
    } catch (err) {
      viewData.categoriesMessage = "no results";
    }
  
    // render the "shop" view with all of the data
    res.render("shop", { data: viewData });
  });  

  app.get("/items", ensureLogin, async (req, res) => {
    let viewData = {};
  
    try {
      // Fetch items from the database
      let items = [];
      
      if (req.query.category) {
        items = await storeService.getItemsByCategory(req.query.category);
      } else {
        items = await storeService.getAllItems(); 
      }
  
      // Check if there are any items, otherwise show an error message
      if (items.length > 0) {
        viewData.items = items;
        res.render("items", viewData); 
      } else {
        viewData.message = "No results";
        res.render("items", viewData); 
      }
  
    } catch (err) {
      viewData.message = "Error fetching items";
      res.render("items", viewData); 
    }
});

// Route for "/categories" to return all categories
app.get("/categories", ensureLogin, async (req, res) => {
    let viewData = {};
  
    try {
      // Fetch categories from the database
      let categories = await categoryData.getCategories();
  
      if (categories.length > 0) {
        viewData.categories = categories;
        res.render("categories", viewData);
      } else {
        viewData.message = "No results";
        res.render("categories", viewData);
      }
  
    } catch (err) {
      viewData.message = "Error fetching categories";
      res.render("categories", viewData);
    }
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
        items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
  
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

// Start the server after initializing both store and auth data services
storeService.initialize()
    .then(authData.initialize)
    .then(() => {
        console.log("Store and Auth data services initialized successfully.");
        app.listen(HTTP_PORT, () => {
            console.log(`Express HTTP server listening on port ${HTTP_PORT}`);
        });
    })
    .catch((err) => {
        console.error("Unable to start server: ", err);
    });

// POST route for adding a category
app.post("/categories/add", ensureLogin, (req, res) => {
  storeService.addCategory(req.body)
    .then(() => {
      res.redirect("/categories");
    })
    .catch((err) => {
      res.status(500).send("Unable to Add Category");
    });
});

// GET route for deleting a category by ID
app.get("/categories/delete/:id", ensureLogin, (req, res) => {
  storeService.deleteCategoryById(req.params.id)
    .then(() => {
      res.redirect("/categories");
    })
    .catch((err) => {
      res.status(500).send("Unable to Remove Category / Category not found)");
    });
});

// GET route for deleting an item by ID
app.get("/Items/delete/:id", ensureLogin, (req, res) => {
  storeService.deletePostById(req.params.id)
    .then(() => {
      res.redirect("/Items");
    })
    .catch((err) => {
      res.status(500).send("Unable to Remove Item / Item not found)");
    });
});