const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const userSchema = new Schema({
    userName: {
      type: String,
      unique: true,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    loginHistory: [
      {
        dateTime: Date,
        userAgent: String
      }
    ]
  });
  
  let User; 

  module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection("mongodb+srv://ytsegaye:ZbXhizjNDe9wGZvn@web322-as6.m3lbxmy.mongodb.net/");

        db.on('error', (err) => {
            reject(err); // reject the promise with the provided error
        });
        db.once('open', () => {
            User = db.model("users", userSchema);
            resolve();
        });
    });
};

module.exports.registerUser = function(userData) {
    return new Promise(function(resolve, reject) {
        // Check if passwords match
        if (userData.password !== userData.password2) {
            reject("Passwords do not match");
            return;
        }

        // Hash the password using bcrypt
        bcrypt.hash(userData.password, 10)
            .then(hash => {
                // Replace plain text password with hashed version
                userData.password = hash;
                
                // Create a new User from userData
                let newUser = new User(userData);
                
                // Attempt to save the new user
                newUser.save()
                    .then(() => {
                        resolve();
                    })
                    .catch((err) => {
                        // Check if the error is a duplicate key error
                        if (err.code === 11000) {
                            reject("User Name already taken");
                        } else {
                            reject(`There was an error creating the user: ${err}`);
                        }
                    });
            })
            .catch(err => {
                reject("There was an error encrypting the password");
                console.log(err);
            });
    });
};

module.exports.checkUser = function(userData) {
    return new Promise(function(resolve, reject) {
        User.find({ userName: userData.userName })
            .exec()
            .then((users) => {
                if (users.length === 0) {
                    reject(`Unable to find user: ${userData.userName}`);
                    return;
                }
                bcrypt.compare(userData.password, users[0].password)
                    .then(result => {
                        if (!result) {
                            // Passwords don't match
                            reject(`Incorrect Password for user: ${userData.userName}`);
                            return;
                        }

                        // Add login attempt to history
                        users[0].loginHistory.push({
                            dateTime: (new Date()).toString(),
                            userAgent: userData.userAgent
                        });

                        // Update user in database
                        User.updateOne(
                            { userName: users[0].userName },
                            { $set: { loginHistory: users[0].loginHistory } }
                        )
                        .exec()
                        .then(() => {
                            // Return the user object
                            resolve(users[0]);
                        })
                        .catch((err) => {
                            reject(`There was an error verifying the user: ${err}`);
                        });
                    })
                    .catch(err => {
                        reject(`There was an error comparing passwords: ${err}`);
                    });
            })
            .catch((err) => {
                reject(`Unable to find user: ${userData.userName}`);
            });
    });
};