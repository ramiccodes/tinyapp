// ========================== Modules ==========================
const express = require('express');
const bcryptjs = require('bcryptjs');
let cookieSession = require('cookie-session');
const { getUserByEmail } = require('./helpers');
const app = express();
const PORT = 8080;

// ========================== "Databases" ==========================
const urlDatabase = {
  "b2xVn2": {longURL : "http://www.lighthouselabs.ca", userID: "aJ48lW"},
  "9sm5xK": {longURL : "http://www.google.com", userID: "aJ48lW"},
  "0sm5xK": {longURL : "http://www.hello.com", userID: "aa48lW"}
};

const users = {
  aJ48lW: {
    id: "aJ48lW",
    email: "a@a.com",
    password: "a",
  },
  aa48lW: {
    id: "aa48lW",
    email: "b@b.com",
    password: "b",
  },
}

// ========================== Functions =========================
const generateRandomString = () => {
  let urlId = "";
  const alphanumeric = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z","A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", 1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = urlId.length; i < 6; i++) {
    let randomIndex = Math.floor(Math.random() * alphanumeric.length);
    let item = alphanumeric[randomIndex];
    urlId += item;
  }
  return urlId;
}

const urlsForUser = (id) => {
  let urls = {}
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      urls[url] = urlDatabase[url];
    }
  }
  return urls;
}

// ========================== Middleware ==========================
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'userID',
  keys: ["secret"],
}));

// ========================== Endpoints ==========================
app.get("/", (req, res) => {
  res.send("Please go to the endpoint /login!");
});

app.get("/login", (req, res) => {
  const templateVars = {users, cookie: req.session.user_id};
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  res.render("urls_login", templateVars)
})

app.post("/login", (req, res) => {
  const hashedPassword = bcryptjs.hashSync(req.body.password, 10);
  if (req.body.email === '' || req.body.password === '') {
    return res.status(400).send("Email or Password not available");
  }
  for (const userId in users) {
    let user = users[userId];
    if (user.email === req.body.email) {
      if (bcryptjs.compareSync(req.body.password, hashedPassword)) {
        req.session.user_id = user.id
        return res.redirect("/urls");
      }
    }
  }
  return res.status(403).send("Incorrect email or password");
})

app.post("/logout", (req, res) => {
  res.clearCookie('userID');
  res.clearCookie('userID.sig');
  res.redirect("/login");
})

app.post("/register", (req, res) => {
  let id = generateRandomString();
  if (req.body.email === '' || req.body.password === '') {
    return res.status(400).send("Email or Password not available");
  }
  for (const userId in users) {
    let user = users[userId];
    if (user.email === req.body.email) {
      return res.status(400).send("Email already registered");
    }
  }
  // Sets the key and the id as the return value of the generateRandomString function, email as the value from the form and the password but it is hashed.
  users[id] = {id: id, email: req.body.email, password: bcryptjs.hashSync(req.body.password, 10)};
  req.session.user_id = users[id].id;
  return res.redirect("/urls");
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  const templateVars = {users, cookie: req.session.user_id};
  res.render("urls_register", templateVars);
})

app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.send("You must be logged in to see and create shortened URLs.");
  }
  const templateVars = {urls: urlDatabase, users, cookie: req.session.user_id};
  res.render("urls_index", templateVars);
})

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  const templateVars = {users, cookie: req.session.user_id};
  res.render("urls_new", templateVars);
})

app.post("/urls", (req, res) => {
  let id = generateRandomString();
  if (!req.session.user_id) {
    return res.send("You cannot shorten links without creating an account");
  }
  // Sets the key in the urlDatabase as the return value of the generateRandomString function and the value as the longURL as the url received from the form and the userID as the cookie.
  urlDatabase[id] = {longURL: req.body.longURL, userID: req.session.user_id};
  res.redirect(`/urls/${id}`);
})

app.post("/urls/:id/delete", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.send("This URL link does not exist!")
  }
  if (!req.session.user_id) {
    return res.send("You must be logged in to delete this URL");
  }
  // If the urlDatabase key and the urlDatabase key's userID are not equal to the cookie.
  if (urlDatabase[req.params.id] && urlDatabase[req.params.id].userID !== req.session.user_id) {
    return res.send("You cannot delete this link without being the owner");
  }
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
})

app.post("/urls/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.send("This URL link does not exist!")
  }
  if (!req.session.user_id) {
    return res.send("You must be logged in to edit this URL");
  }
  // If the urlDatabase key and the urlDatabase key's userID are not equal to the cookie.
  if (urlDatabase[req.params.id] && urlDatabase[req.params.id].userID !== req.session.user_id) {
    return res.send("You cannot edit this link without being the owner");
  }
  // Sets the key in the urlDatabase as the params id in the search bar and the value as the longURL as the url received from the form and the userID as the cookie.
  urlDatabase[req.params.id] = {longURL: req.body.longURL, userID: req.session.user_id};
  return res.redirect("/urls");
})

app.get("/urls/:id", (req, res) => {
  if (!req.session.user_id) {
    res.send("You must log in first before you can access this URL page")
  }
  if (urlDatabase[req.params.id] && urlDatabase[req.params.id].userID === req.session.user_id) {
    const templateVars = {id: req.params.id, urls: urlDatabase[req.params.id], users, cookie: req.session.user_id};
        return res.render("urls_show", templateVars);
  }
  return res.send("You do not have permission to edit this URL");
})

app.get("/u/:id", (req, res) => {
  for (let url in urlDatabase) {
    if (url === req.params.id) {
      const longURL = urlDatabase[url].longURL;
      res.redirect(longURL);
    }
  }
  res.send("This short link does not exist");
})

// ========================== Listener ==========================
app.listen(PORT, () => {
  console.log(`Example app is listening on port ${PORT}`);
});

