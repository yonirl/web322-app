const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('neondb', 'neondb_owner', 'npg_8lLeZO9uacEU', {
  host: 'ep-summer-sky-a4uconjm-pooler.us-east-1.aws.neon.tech', 
  dialect: 'postgres', 
  port: 5432,
  dialectOptions: {
      ssl: { rejectUnauthorized: false }
  },
  query: { raw: true }
});

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch((err) => {
    console.log('Unable to connect to the database:', err);
  });

  const Item = sequelize.define('Item', {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN,
    price: Sequelize.DOUBLE
  });
  
  // Define the Category model
  const Category = sequelize.define('Category', {
    category: Sequelize.STRING
  });
  
  // Define the relationship - Item belongs to Category
  Item.belongsTo(Category, {foreignKey: 'category'});

// initialize() function to read items and categories JSON files
function initialize() {
  return new Promise((resolve, reject) => {
    sequelize.sync()
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject("unable to sync the database");
      });
  });
}

// addItem(itemData) function to add a new item
function addItem(itemData) {
  return new Promise((resolve, reject) => {
    // Set published property correctly
    itemData.published = (itemData.published) ? true : false;
    
    // Replace empty strings with null
    for (let prop in itemData) {
      if (itemData[prop] === "") {
        itemData[prop] = null;
      }
    }
    
    // Set postDate to current date
    itemData.postDate = new Date();
    
    // Create the item
    Item.create(itemData)
      .then(() => {
        resolve();
      })
      .catch(err => {
        reject("unable to create item");
      });
  });
}
// Function to get items by category
function getItemsByCategory(category) {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: {
        category: category
      }
    })
      .then(items => {
        resolve(items); // Always resolve
      })
      .catch(err => {
        reject("no results returned");
      });
  });
}
// Function to get items by minimum postDate
function getItemsByMinDate(minDateStr) {
  return new Promise((resolve, reject) => {
    const { gte } = Sequelize.Op;
    
    Item.findAll({
      where: {
        postDate: {
          [gte]: new Date(minDateStr)
        }
      }
    })
      .then(items => {
        if (items.length > 0) {
          resolve(items);
        } else {
          reject("no results returned");
        }
      })
      .catch(err => {
        reject("no results returned");
      });
  });
}

function getAllItems() {
  return new Promise((resolve, reject) => {
    Item.findAll()
      .then(items => {
        resolve(items); // Always resolve, even if empty
      })
      .catch(err => {
        reject("no results returned");
      });
  });
}

// getPublishedItems() function to return items with "published" set to true
function getPublishedItems() {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: {
        published: true
      }
    })
      .then(items => {
        if (items.length > 0) {
          resolve(items);
        } else {
          reject("no results returned");
        }
      })
      .catch(err => {
        reject("no results returned");
      });
  });
}

// getCategories() function to return all categories
function getCategories() {
  return new Promise((resolve, reject) => {
    Category.findAll()
      .then(categories => {
        if (categories.length > 0) {
          resolve(categories);
        } else {
          reject("no results returned");
        }
      })
      .catch(err => {
        reject("no results returned");
      });
  });
}

function getItemById(id) {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: {
        id: id
      }
    })
      .then(items => {
        if (items.length > 0) {
          resolve(items[0]); // Return only the first object
        } else {
          reject("no results returned");
        }
      })
      .catch(err => {
        reject("no results returned");
      });
  });
}

function getPublishedItemsByCategory(category) {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: {
        published: true,
        category: category
      }
    })
      .then(items => {
        if (items.length > 0) {
          resolve(items);
        } else {
          reject("no results returned");
        }
      })
      .catch(err => {
        reject("no results returned");
      });
  });
}
function addCategory(categoryData) {
  return new Promise((resolve, reject) => {
    // Replace empty values with null
    for (let prop in categoryData) {
      if (categoryData[prop] === "") {
        categoryData[prop] = null;
      }
    }

    // Create the category in the database
    Category.create(categoryData)
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject("Unable to create category");
      });
  });
}

function deleteCategoryById(id) {
  return new Promise((resolve, reject) => {
    Category.destroy({
      where: { id: id }
    })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject("Unable to delete category");
      });
  });
}
function deletePostById(id) {
  return new Promise((resolve, reject) => {
      Item.destroy({  

          where: {
              id: id
          }
      })
      .then((deleted) => {
          if (deleted) {
              resolve();
          } else {
              reject("Item not found");  
          }
      })
      .catch((err) => {
          reject(err);
      });
  });
}

// Export functions for use in the server.js file
module.exports = {
  initialize,
  getAllItems,
  getPublishedItems,
  getCategories,
  addItem,
  getItemsByCategory,
  getItemsByMinDate,
  getItemById,
  getPublishedItemsByCategory,
  addCategory,
  deleteCategoryById,
  deletePostById
};