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

// initialize() function to read items and categories JSON files
function initialize() {
  return new Promise((resolve, reject) => {
    // Read items.json file
    readJsonFile(path.join(__dirname, 'data', 'items.json'))
      .then((itemsData) => {
        items = itemsData;  // Assign parsed data to the items array
        // After items.json is successfully loaded, read categories.json
        return readJsonFile(path.join(__dirname, 'data', 'categories.json'));
      })
      .then((categoriesData) => {
        categories = categoriesData;  // Assign parsed data to the categories array
        resolve("Data successfully loaded");  // Resolve when both files are read and parsed
      })
      .catch((err) => {
        reject(err);  // Reject with the error message if any of the file operations fail
      });
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

// Export functions for use in the server.js file
module.exports = {
  initialize,
  getAllItems,
  getPublishedItems,
  getCategories
};
