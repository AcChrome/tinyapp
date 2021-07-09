const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080;

const { findEmail } = require("./helpers");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use(
  cookieSession({
    name: "session",
    keys: ["key1", "key2"],
  })
);

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

function generateRandomString() {
  let result = "";
  let alphaNum =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
  for (let i = 0; i < 6; i++) {
    let random = Math.round(Math.random() * (alphaNum.length - 1));
    result += alphaNum[random];
  }
  return result;
}

const getUser = function (users, userId) {
  return users[userId];
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: null,
  };
  if (req.session["userId"]) {
    return res.redirect("/urls");
  }
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: null,
  };
  if (req.session["userId"]) {
    return res.redirect("/urls");
  }
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  console.log("email:", email);
  console.log("pass:", password);
  if (!email || !password) {
    return res.status(403).send("e-mail or password is invalid");
  }
  console.log("database:", urlDatabase);
  const user = findEmail(email, users);
  console.log("user:", user);
  console.log("users:", users);
  if (!user) {
    return res.status(403).send("e-mail is not register");
  }
  bcrypt.compare(password, user.password, (err, result) => {
    if (!result) {
      return res.status(403).send("password is invalid");
    }
    req.session.userId = user.id;
    res.redirect("/urls");
  });
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    return res.status(403).send("e-mail or password is invalid");
  }
  const user = findEmail(email, users);
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
      // console.log(users);
      res.redirect("/login");
    });
  });
});

app.post("/urls/new", (req, res) => {
  const shortURL = req.params.shortURL;
  const newURL = req.body.newURL;
  urlDatabase[shortURL].longURL = newURL;
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  urlDatabase[shortURL] = {
    longURL,
    userID: req.session["userId"],
  };
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

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

app.post("/urls/login", (req, res) => {
  req.session["userId"];
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    userID: null,
    user: getUser(users, req.session["userId"]),
  };
  if (!req.session["userId"]) {
    return res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];

  if (longURL === undefined) {
    return res.status(404).send("Url not found");
  }

  res.redirect(longURL);
});

app.get("/urls", (req, res) => {
  let currentUser = req.session["userId"];
  let userUrl = {};
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

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// req.body -> {input1: 'hello worlds', }
/*
<form method="POST" action="/urls/:shortURL/:myVariable">
<input type="text" name="input1" />
<input type="text" name="input2" />
<button type="submit">Submit</button>
</form>
*/

// req.params -> {shortURL: 'hello', myVariable: 'world'}

// visit /urls/hello/world
// app.post("/urls/:shortURL/:myVariable", (req, res) => {
//   const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
//   res.render("urls_show", templateVars);
// });
