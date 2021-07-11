const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "user",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user",
  },
};

const users = {
  user: {
    id: "user",
    email: "user@gmail.com",
    password: "1234",
  },
};

// Used to check whether e-mail matches with any existing e-mail
const findEmail = (email, database) => {
  for (const usersId in database) {
    const user = database[usersId];
    // if e-mail exist, give access to the user ID
    if (user.email === email) {
      return user;
    }
  }
  // return null if no matching e-mail exist
  return null;
};

// Generates random ID for user and shortURL
function generateRandomString() {
  let result = "";
  let alphaNum =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
    // Loop to ensure the generated ID is no more than a mix of 6 letters or numbers
  for (let i = 0; i < 6; i++) {
    let random = Math.round(Math.random() * (alphaNum.length - 1));
    result += alphaNum[random];
  }
  return result;
};

// Access the ID of the current user
const getUser = function (users, userId) {
  return users[userId];
};

module.exports = {
  urlDatabase,
  users,
  findEmail,
  generateRandomString,
  getUser,
};
