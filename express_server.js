// Node dependencies/exports
const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080;

// imported helper functions
const {
  urlDatabase,
  users,
  findEmail,
  generateRandomString,
  getUser,
} = require("./helpers");

// View engine for rendering
app.set("view engine", "ejs");

// Dependency setups for use
app.use(bodyParser.urlencoded({ extended: true }));

// Using cookie-session as a middleware to manager user sessions
app.use(morgan("dev"));
app.use(
  cookieSession({
    name: "session",
    //Using two session key
    keys: ["key1", "key2"],
  })
);

// GET request directly to homepage
app.get("/", (req, res) => {
  const templateVars = {
    user: getUser(users, req.session["user_id"]),
  };

  // redirect to login page if no existing user is logged in
  if (req.session["user_id"]) {
    return res.redirect("/urls");
  }
  res.render("login", templateVars);
});

app.get("/urls", (req, res) => {
  let currentUser = req.session["user_id"];
  let userUrl = {};

  // Only allows signed in user to view their own URL
  for (const short in urlDatabase) {
    if (urlDatabase[short].userID === currentUser) {
      userUrl[short] = urlDatabase[short].longURL;
    } else if (!currentUser) {
      // Return error when no user is logged in
      return res.status(403).send("unauthorized access");
    }
  }
  const templateVars = {
    urls: userUrl,
    user: getUser(users, req.session["user_id"]),
  };
  res.render("urls_index", templateVars);
});

// POST request page to view URLS made by current user
app.post("/urls", (req, res) => {
  
  // Check for the users if they are logged in;
  if (req.session["user_id"]) {
    let shortURL = generateRandomString();
    let longURL = req.body.longURL;
    urlDatabase[shortURL] = {
      longURL,
      userID: req.session["user_id"],
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    
    // If the user is not logged in
    return res.status(403).send("unauthorized access please login");
  }
});

// GET request to view registration page
app.get("/register", (req, res) => {
  const templateVars = {
    user: null,
  };
  // Redirect to homepage once logged in
  if (req.session["user_id"]) {
    return res.redirect("/urls");
  }
  res.render("register", templateVars);
});

// POST request to view registration page and make account
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // check if e-mail or password is valid
  if (!email || !password) {
    return res.status(403).send("e-mail or password is invalid");
  }
  const user = findEmail(email, users);

  // Check if e-mail is used
  if (user) {
    return res.status(403).send("email already used");
  }

  // Creates a random user iq as well as hashes the password for security
  const id = generateRandomString();
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, (err, hash) => {
      users[id] = {
        id,
        email,
        password: hash,
      };

      // Automatically logs user in and return to homepage
      req.session.user_id = users[id].id;
      return res.redirect("/urls");
    });
  });
});

// GET request for viewing of login page
app.get("/login", (req, res) => {
  const templateVars = {
    user: null,
  };

  // Redirect to homepage after logged in successfully
  if (req.session["user_id"]) {
    return res.redirect("/urls");
  }
  res.render("login", templateVars);
});

// POST request to view page and login
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // Check to see if e-mail and password is valid, if not returns a error status
  if (!email || !password) {
    return res.status(403).send("e-mail or password is invalid");
  }
  const user = findEmail(email, users);

  // Check to see user exist, if not returns and error status
  if (!user) {
    return res.status(403).send("e-mail is not register");
  }
  bcrypt.compare(password, user.password, (err, result) => {
    // Check to make sure password matches before logging in and redirecting user back to homepage
    if (!result) {
      return res.status(403).send("password is invalid");
    }
    req.session.user_id = user.id;
    res.redirect("/urls");
  });
});

// GET request to view page for making new URL
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: getUser(users, req.session["user_id"]),
  };

  // redirect to login page if no existing user is logged in
  if (!req.session["user_id"]) {
    return res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

// POST request to access page to create new URL
app.post("/urls/new", (req, res) => {
  const shortURL = req.params.shortURL;
  const newURL = req.body.newURL;
  urlDatabase[shortURL].longURL = newURL;
  if (newURL === "" || newURL === "http://") {
    return res.status(403).send("Url cannot be empty");
  }
  res.redirect("/urls");
});

// GET request to edit URL with the right user
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  // Return error if link is not found
  if (!urlDatabase[shortURL]) {
    return res.status(404).send("Url not found");
  }
  let currentUser = req.session["user_id"];
  let userId = urlDatabase[req.params.shortURL].userID;
  if (userId === currentUser) {
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      userID: urlDatabase[req.params.shortURL].userID,
      user: getUser(users, req.session["user_id"]),
    };
    return res.render("urls_show", templateVars);
  } else {
    return res
      .status(404)
      .send("You are not authorized to perform this action");
  }
});

// GET request to use the created short URL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  // Lets user be redirected to the actually link from the short URL
  if (urlDatabase[shortURL]) {
    const longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL);
  } else {
    // Returns message to let user know there is an issue with URL
    return res.status(404).send("Url not found or invalid");
  }
});

// POST request to edit short URL
app.post("/urls/:shortURL/edit", (req, res) => {
  const shortURL = req.params.shortURL;
  const newURL = req.body.newURL;
  let currentUser = req.session["user_id"];

  // condition to deny access if no user is logged in
  if (currentUser === urlDatabase[shortURL].userID) {
    urlDatabase[shortURL].longURL = newURL;
  } else {
    return res
      .status(403)
      .send("You are not authorized to perform this action");
  }
  res.redirect("/urls");
});

// POST request to delete short url with delete button
app.post("/urls/:shortURL/delete", (req, res) => {
  let currentUser = req.session["user_id"];
  let userId = urlDatabase[req.params.shortURL].userID;

  // Condition to allow access only if user is logged in
  if (userId === currentUser) {
    const shortURL = req.params.shortURL;
    delete urlDatabase[shortURL];
    return res.redirect("/urls");
  } else {
    return res
      .status(401)
      .send("You are not authorized to perform this action");
  }
});

// POST request for logging out and automatically brings us back to login page
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
