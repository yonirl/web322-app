const fs = require('fs');  // For reading files
const path = require('path');  // For handling file paths

// Declare global variables to store data
let items = [];
let categories = [];

// Helper function to handle file reading and parsing
function readJsonFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(`Unable to read file: ${filePath}`);
      } else {
        try {
          resolve(JSON.parse(data));
        } catch (parseErr) {
          reject(`Error parsing file: ${filePath}`);
        }
      }
    });
  });
}

// Helper function to write data to a JSON file
function writeJsonFile(filePath, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8', (err) => {
      if (err) {
        reject(`Error writing to file: ${filePath}`);
      } else {
        resolve();
      }
    });
  });
}

// initialize() function to read items and categories JSON files
function initialize() {
  return new Promise((resolve, reject) => {
    // Read items.json file
    readJsonFile(path.join(__dirname, 'data', 'items.json'))
      .then((itemsData) => {
        items = itemsData;  
        return readJsonFile(path.join(__dirname, 'data', 'categories.json'));
      })
      .then((categoriesData) => {
        categories = categoriesData;  
        resolve("Data successfully loaded");  
      })
      .catch((err) => {
         // Reject with the error message if any of the file operations fail
        reject(err); 
      });
  });
}

// addItem(itemData) function to add a new item
function addItem(itemData) {
  return new Promise((resolve, reject) => {
    // set the "published" property if it's undefined
    if (itemData.published === undefined) {
      itemData.published = false; // Default to false if not provided
    }

    // set the "id" property to the length of the array + 1
    itemData.id = items.length + 1;

    // set the "postDate" property to the current date (YYYY-MM-DD)
    const currentDate = new Date();
    const formattedDate = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
    itemData.postDate = formattedDate; // Add the current date as postDate

    // add the new item to the "items" array
    items.push(itemData);

    // save the updated items array back to the JSON file
    writeJsonFile(path.join(__dirname, 'data', 'items.json'), items)
      .then(() => {
        resolve(itemData); // Return the newly added item
      })
      .catch((err) => {
        reject(`Error saving updated items: ${err}`);
      });
  });
}

// Function to get items by category
function getItemsByCategory(category) {
  return new Promise((resolve, reject) => {
      const filteredItems = items.filter(item => item.category === parseInt(category)); // Convert to integer
      if (filteredItems.length > 0) {
          resolve(filteredItems);
      } else {
          reject('No items found for the given category');
      }
  });
}

// Function to get items by minimum postDate
function getItemsByMinDate(minDateStr) {
  return new Promise((resolve, reject) => {
      // Convert the string to Date object
      const minDate = new Date(minDateStr); 
      const filteredItems = items.filter(item => new Date(item.postDate) >= minDate);
      if (filteredItems.length > 0) {
          resolve(filteredItems);
      } else {
          reject('No items found for the given date');
      }
  });
}

// getAllItems() function to return all items
function getAllItems() {
  return new Promise((resolve, reject) => {
    if (items.length > 0) {
      resolve(items);  // Resolve with all items if they exist
    } else {
      reject("No results returned");  // Reject if no items exist
    }
  });
}

// getPublishedItems() function to return items with "published" set to true
function getPublishedItems() {
  return new Promise((resolve, reject) => {
    const publishedItems = items.filter(item => item.published === true);
    if (publishedItems.length > 0) {
      resolve(publishedItems);  // Resolve with published items
    } else {
      reject("No results returned");  // Reject if no published items exist
    }
  });
}

// getCategories() function to return all categories
function getCategories() {
  return new Promise((resolve, reject) => {
    if (categories.length > 0) {
      resolve(categories);  // Resolve with all categories if they exist
    } else {
      reject("No results returned");  // Reject if no categories exist
    }
  });
}

function getItemById(id) {
  return new Promise((resolve, reject) => {
    const item = items.find(item => item.id === parseInt(id));  // Find the item by its ID
    if (item) {
      resolve(item);  // Return the item if found
    } else {
      reject(`Item with ID ${id} not found`);  // Reject if no item is found
    }
  });
}

function getPublishedItemsByCategory(category) {
  return new Promise((resolve, reject) => {
      // Get all items (assuming you already have a function to get all items)
      getAllItems()
          .then((items) => {
              // Filter items that are published and match the given category
              const filteredItems = items.filter(item => item.published && item.category == category);
              resolve(filteredItems);
          })
          .catch((err) => {
              console.error("Error fetching items by category:", err);
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
  getPublishedItemsByCategory
};