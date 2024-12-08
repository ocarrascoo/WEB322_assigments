/********************************************************************************* 

WEB322 – Assignment 05 
I declare that this assignment is my own work in accordance with Seneca
Academic Policy.  No part of this assignment has been copied manually or 
electronically from any other source (including 3rd party web sites) or 
distributed to other students. I acknoledge that violation of this policy
to any degree results in a ZERO for this assignment and possible failure of
the course. 

Name:   Omar Carrasco   
Student ID:   156333221
Date:  07/12/2024
Cyclic Web App URL:  
GitHub Repository URL:  

********************************************************************************/

const express = require("express");
const itemData = require("./store-service");
const path = require("path");

// 3 new modules, multer, cloudinary, streamifier
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// AS4, Setup handlebars
const exphbs = require("express-handlebars");
const { Console } = require("console");

// Configure Cloudinary. This API information is
// inside of the Cloudinary Dashboard - https://console.cloudinary.com/
cloudinary.config({
  cloud_name: "dvaghpm4p",
  api_key: "858951838924532",
  api_secret: "1ismTLWLhUgkIGGADveWrq1Lx9A",
  secure: true,
});

//  "upload" variable without any disk storage
const upload = multer(); // no { storage: storage }

// const upload = multer({ dest: 'uploads/' })

const app = express();

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));


//This will add the property "activeRoute" to "app.locals" whenever the route changes, i.e. if our route is "/store/5", the app.locals.activeRoute value will be "/store".  Also, if the shop is currently viewing a category, that category will be set in "app.locals".
app.use(function (req, res, next) {
  let route = req.path.substring(1);

  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""));

  app.locals.viewingCategory = req.query.category;

  next();
});

// Handlebars Setup
app.engine(
  ".hbs",
  exphbs.engine({
    extname: ".hbs",
    helpers: {
      navLink: function (url, options) {
        return (
          '<li class="nav-item"><a ' +
          (url == app.locals.activeRoute
            ? ' class="nav-link active" '
            : ' class="nav-link" ') +
          ' href="' +
          url +
          '">' +
          options.fn(this) +
          "</a></li>"
        );
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      }
    },
  })
);

app.set("view engine", ".hbs");

app.get("/", (req, res) => {
  res.redirect("/about");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/shop", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "item" objects
    let items = [];

    // if there's a "category" query, filter the returned items by category
    if (req.query.category) {
      // Obtain the published "items" by category
      console.log('categories');
      items = await itemData.getPublishedItemsByCategory(req.query.category);
    } else {
      // Obtain the published "items"
      items = await itemData.getPublishedItems();
    }

    // sort the published items by postDate
    items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // get the latest item from the front of the list (element 0)
    let item = items[0];

    // store the "items" and "item" data in the viewData object (to be passed to the view)
    viewData.items = items;
    viewData.item = item;

  } 
  catch (err) {
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

// Accept queryStrings
app.get("/items", (req, res) => {
  let queryPromise = null;

  if (req.query.category) {
    queryPromise = itemData.getItemsByCategory(req.query.category);
  } else if (req.query.minDate) {
    queryPromise = itemData.getItemsByMinDate(req.query.minDate);
  } else {
    queryPromise = itemData.getAllItems();
  }

  queryPromise
    .then((data) => {
      if (data.length > 0) {
        res.render("items", { items: data });
      } else {
        res.render("items", { message: "No results found" });
      }
    })
    .catch(() => {
      res.render("items", { message: "Error retrieving items" });
    });
});


// A route for items/add
app.get('/items/add', (req, res) => {
  itemData.getCategories()
    .then(categories => {
      // Render the addItem view with categories data
      res.render('addItem', { categories });
    })
    .catch(err => {
      console.error(err);
      // Render the addItem view with an empty array if the promise fails
      res.render('addItem', { categories: [] });
    });
});

app.post("/items/add", upload.single("featureImage"), (req, res) => {
  try {
    if (req.file) {
      let streamUpload = (req) => {
        return new Promise((resolve, reject) => {
          let stream = cloudinary.uploader.upload_stream((error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          });
  
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
      };
  
      async function upload(req) {
        let result = await streamUpload(req);
  
        console.log(result);
  
        return result;
      }
  
      upload(req).then((uploaded) => {
        processItem(uploaded.url);
      });
    } else {
      processItem("");
    }
  
    function processItem(imageUrl) {
      req.body.featureImage = imageUrl;
  
      // TODO: Process the req.body and add it as a new Item before redirecting to /items
      itemData
        .addItem(req.body)
        .then((post) => {
          res.redirect("/items");
        })
        .catch((err) => {
          res.status(500).send(err);
        });
    }
  } catch (error) {
    console.error(error)
  }
});

// Get an individual item
app.get("/item/:id", (req, res) => {
  itemData
    .getItemById(req.params.id)
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      res.json({ message: err });
    });
});

app.get("/items/delete/:id", (req, res) => {
  itemData
      .deleteItemById(req.params.id)
      .then(() => {
          res.redirect("/items");
      })
      .catch(() => {
          res.status(500).send("Unable to Remove Item / Item not found");
      });
});



app.get("/categories", (req, res) => {
  itemData
    .getCategories()
    .then((data) => {
      if (data.length > 0) {
        // Render categories if there is data
        res.render("categories", { categories: data });
      } else {
        // Render the "no results" message if the array is empty
        res.render("categories", { message: "No categories found" });
      }
    })
    .catch((err) => {
      // Render an error message if the promise is rejected
      res.render("categories", { message: "Error retrieving categories" });
    });
});

// Render form for adding a category
app.get("/categories/add", (req, res) => {
  res.render("addCategory");
});

// Handle the POST request for adding a category
app.post("/categories/add", (req, res) => {
  itemData
    .addCategory(req.body)
    .then(() => {
      res.redirect("/categories");
    })
    .catch((err) => {
      res.status(500).send("Unable to add category");
    });
});

app.get("/categories/delete/:id", (req, res) => {
  itemData
    .deleteCategoryById(req.params.id)
    .then(() => {
      res.redirect("/categories");
    })
    .catch(() => {
      res.status(500).send("Unable to Remove Category / Category not found");
    });
});


app.get('/shop/:id', async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try{

      // declare empty array to hold "item" objects
      let items = [];

      // if there's a "category" query, filter the returned posts by category
      if(req.query.category){
          // Obtain the published "posts" by category
          items = await itemData.getPublishedItemsByCategory(req.query.category);
      }else{
          // Obtain the published "posts"
          items = await itemData.getPublishedItems();
      }

      // sort the published items by postDate
      items.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

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

app.use((req, res) => {
  res.status(404).render("404");
})

itemData
  .initialize()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log("server listening on: " + HTTP_PORT);
    });
  })
  .catch((err) => {
    console.log(err);
  });
