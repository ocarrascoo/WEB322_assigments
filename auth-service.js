const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the user schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true // Ensures the username must be unique
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true // Ensures the email must be unique
  },
  loginHistory: [{
    dateTime: {
      type: Date,
      default: Date.now // Automatically sets the current date/time
    },
    userAgent: {
      type: String
    }
  }]
});

// Create the User model
let User;

const initialize = () => {
  // Connect to the MongoDB database
  mongoose.connect('mongodb+srv://omalomac:Oma0202r@cluster0.d1irf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/web', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('Connected to MongoDB');
    User = mongoose.model('User', userSchema);
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });
};

// Function to register a new user
const registerUser = (userData) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Validate that passwords match
      if (userData.password !== userData.password2) {
        return reject("Passwords do not match");
      }

      // Hash the password before saving
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);

      // Create a new user instance
      let newUser = new User(userData);

      // Save the user to the database
      await newUser.save();
      
      // If successful, resolve the promise without a message
      resolve();
    } catch (err) {
      // Check for duplicate key error
      if (err.code === 11000) {
        return reject("User Name already taken");
      }
      
      // Handle other errors
      reject(`There was an error creating the user: ${err}`);
    }
  });
};


const checkUser = (userData) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Search for the user by username
        const users = await User.find({ username: userData.userName });
  
        // If the user is not found, reject with a meaningful message
        if (users.length === 0) {
          return reject(`Unable to find user: ${userData.userName}`);
        }
  
        // Check if the provided password matches the stored password
        const user = users[0];
        const isMatch = await bcrypt.compare(userData.password, user.password);
  
        if (!isMatch) {
          return reject(`Incorrect Password for user: ${userData.userName}`);
        }
  
        // If the password matches, add the login attempt to the loginHistory array
        user.loginHistory.push({
          dateTime: (new Date()).toString(),
          userAgent: userData.userAgent
        });
  
        // Update the user's loginHistory in the database
        await User.updateOne({ username: user.username }, { $set: { loginHistory: user.loginHistory } });
  
        // If successful, resolve the promise with the user object
        resolve(user);
  
      } catch (err) {
        // Handle any errors during the process
        reject(`There was an error verifying the user: ${err}`);
      }
    });
  };
  

module.exports = {
  initialize,
  registerUser,
  checkUser,
  User
};
