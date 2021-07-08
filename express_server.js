const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieParser =require("cookie-parser");
const app = express();
const PORT = 8080;


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(morgan('dev'));



const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "user": {
    id: "user",
    email: "user@gmail.com",
    password: "1234"
  }
};

const findEmail = (email) => {
  for (const users_Id in users) {
    const user = users[users_Id];
    if (user.email === email) {
      return user;
    }
  }
  return null; 
};

const getUser = function(users, users_Id) {
  return users[users_Id];
};

function generateRandomString() {
  let result = "";
  let alphaNum = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split('');
  for (let i = 0; i < 6; i++) {
   let random = Math.round(Math.random() * (alphaNum.length - 1));
   result += alphaNum[random];
  }
  return result;
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
  res.render('register');
});

app.get("/login", (req, res) => {
  res.render('login');
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    return res.status(403).send('e-mail or password is invalid');
  }
  const user = findEmail(email) 
  if (!user) {
    return res.status(403).send('e-mail is not register');
  }
  if (user.password !== password) {
    return res.status(403).send('password is invalid');
  }
  res.cookie('users_Id', id);
  res.redirect('/urls');
});



app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(403).send('e-mail or password is invalid');
  }
  const user = findEmail(email);
  if (user) {
    return res.status(403).send('email already used');
  }
  const id = generateRandomString();
  users[id] = {
    id,
    email,
    password
  };
  res.cookie('users_Id', id);
  res.redirect('/login');
});

app.post("/urls", (req, res) => {
  // let shortURL = generateRandomString();
  // let longURL = req.body.longURL;
  // urlDatabase[shortURL] = longURL;
  res.redirect('/register');
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  // console.log(urlDatabase[shortURL]);
  res.redirect('/urls');
});

app.post("/urls/:shortURL/edit", (req, res) => {
  const shortURL =req.params.shortURL;
  const newURL = req.body.newURL;
  urlDatabase[shortURL] = newURL;
  res.redirect('/urls');
});

// app.post("/urls/login", (req, res) => {
//   res.cookie('users_Id', id);
//   console.log(req.cookies);
//   res.redirect('/urls'); 
// });

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: getUser(users, req.cookies['users_Id'])
  };
  res.render("urls_new", templateVars);
});

app.get("/urls", (req, res) => {
  const templateVars = { 
    urls: urlDatabase,
    user: getUser(users, req.cookies['users_Id'])
   };
   console.log('req.cookies:', req.cookies['users_Id']);
  console.log(templateVars.user);
  res.render("urls_index", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
const templateVars = { shortURL: req.params.shortURL, 
  longURL: urlDatabase[req.params.shortURL], 
  user: getUser(users, req.cookies['users_Id'])
};
  res.render("urls_show", templateVars);
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
