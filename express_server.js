// Node dependencies/exports
const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080;
const {
  urlDatabase,
  users,
  findEmail,
  generateRandomString,
  getUser,
} = require("./helpers");

// View engine for rendering

app.set("view engine", "ejs");

// Dependency setups
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(
  cookieSession({
    name: "session",
    keys: ["key1", "key2"],
  })
);

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// GET request directly to homepage
app.get("/", (req, res) => {
  res.send("/urls");
});

// GET request for registration page
app.get("/register", (req, res) => {
  const templateVars = {
    user: null,
  };
  // Redirect to homepage if logged in
  if (req.session["userId"]) {
    return res.redirect("/urls");
  }
  res.render("register", templateVars);
});

// GET request for login page
app.get("/login", (req, res) => {
  const templateVars = {
    user: null,
  };
  // Redirect to homepage after logged in
  if (req.session["userId"]) {
    return res.redirect("/urls");
  }
  res.render("login", templateVars);
});

// POST request to view page and login
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  console.log("email:", email);
  console.log("pass:", password);
  // Check to see if e-mail and password is valid
  if (!email || !password) {
    return res.status(403).send("e-mail or password is invalid");
  }
  console.log("database:", urlDatabase);
  const user = findEmail(email, users);
  console.log("user:", user);
  console.log("users:", users);
  // Check to see user exist
  if (!user) {
    return res.status(403).send("e-mail is not register");
  }
  bcrypt.compare(password, user.password, (err, result) => {
    // Check for matching password
    if (!result) {
      return res.status(403).send("password is invalid");
    }
    req.session.userId = user.id;
    res.redirect("/urls");
  });
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
  const id = generateRandomString();
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, (err, hash) => {
      users[id] = {
        id,
        email,
        password: hash,
      };
      res.redirect("/login");
    });
  });
});

// POST request to view create new url
app.post("/urls/new", (req, res) => {
  const shortURL = req.params.shortURL;
  const newURL = req.body.newURL;
  urlDatabase[shortURL].longURL = newURL;
  res.redirect("/urls");
});

// POST request page to view urls made by current user
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  urlDatabase[shortURL] = {
    longURL,
    userID: req.session["userId"],
  };
  res.redirect(`/urls/${shortURL}`);
});

// POST request to delete short url
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// POST request to edit url
app.post("/urls/:shortURL/edit", (req, res) => {
  const shortURL = req.params.shortURL;
  const newURL = req.body.newURL;
  let currentUser = req.session["userId"];
  if (currentUser === urlDatabase[shortURL].userID) {
    urlDatabase[shortURL].longURL = newURL;
  } else {
    return res.status(403).send("Invalid user");
  }
  res.redirect("/urls");
});

// GET request to make new url
app.get("/urls/new", (req, res) => {
  const templateVars = {
    userID: null,
    user: getUser(users, req.session["userId"]),
  };
  // redirect to login page if no user logged in
  if (!req.session["userId"]) {
    return res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

// GET request to view the short url
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  // Redirect to long url, error if not found
  if (longURL === undefined) {
    return res.status(404).send("Url not found");
  }
  res.redirect(longURL);
});

// GET request to view homepage
app.get("/urls", (req, res) => {
  let currentUser = req.session["userId"];
  let userUrl = {};
  // View only urls made by user
  for (const short in urlDatabase) {
    if (urlDatabase[short].userID === currentUser) {
      userUrl[short] = urlDatabase[short].longURL;
    }
  }
  const templateVars = {
    urls: userUrl,
    user: getUser(users, req.session["userId"]),
  };
  res.render("urls_index", templateVars);
});

// GET request to view and edit short url
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    userID: urlDatabase[req.params.shortURL].userID,
    user: getUser(users, req.session["userId"]),
  };
  console.log("template:", templateVars);
  res.render("urls_show", templateVars);
});

// POST request for logging out
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
