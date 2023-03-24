const express = require('express');
var cookieParser = require('cookie-parser')
const app = express();
const PORT = 8080;


const generateRandomString = () => {
  let urlId = "";
  const alphanumeric = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", 1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = urlId.length; i < 6; i++) {
    let randomIndex = Math.floor(Math.random() * alphanumeric.length);
    let item = alphanumeric[randomIndex];
    urlId += item;
  }
  return urlId;
}

const urlDatabase = {
  "b2xVn2": {longURL : "http://www.lighthouselabs.ca", userID: "aJ48lW"},
  "9sm5xK": {longURL : "http://www.google.com", userID: "aJ48lW"},
  "0sm5xK": {longURL : "http://www.hello.com", userID: "aa48lW"}
};

const urlsForUser = (id) => {
  let urls = {}
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      urls[url] = urlDatabase[url];
    }
  }
  return urls;
}

console.log(urlsForUser("aJ48lW"))

const users = {
  userRandomID: {
    id: "aJ48lW",
    email: "a@a.com",
    password: "a",
  },
  user2RandomID: {
    id: "aa48lW",
    email: "b@b.com",
    password: "b",
  },
}

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello");
});

app.get("/login", (req, res) => {
  const templateVars = {users, cookie: req.cookies["user_id"]};
  if (req.cookies["user_id"]) {
    return res.redirect("/urls");
  }
  res.render("urls_login", templateVars)
})

app.post("/login", (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    return res.status(400).send("Email or Password not available");
  }
  for (const userId in users) {
    let user = users[userId];
    if (user.email === req.body.email) {
      if (user.password === req.body.password) {
        res.cookie('user_id', user.id);
        return res.redirect("/urls");
      }
    }
  }
  return res.status(403).send("Incorrect email or password");
})

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
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
  users[id] = {id: id, email: req.body.email, password: req.body.password};
  res.cookie('user_id', users[id].id);
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  if (req.cookies["user_id"]) {
    return res.redirect("/urls");
  }
  const templateVars = {users, cookie: req.cookies["user_id"]};
  res.render("urls_register", templateVars);
})

app.get("/urls", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.send("You must be logged in to see and create shortened URLs.");
  }
  const templateVars = {urls: urlDatabase, users, cookie: req.cookies["user_id"]};
  res.render("urls_index", templateVars);
})

app.get("/urls/new", (req, res) => {
  if (!req.cookies["user_id"]) {
    return res.redirect("/login");
  }
  const templateVars = {users, cookie: req.cookies["user_id"]};
  res.render("urls_new", templateVars);
})

app.post("/urls", (req, res) => {
  let id = generateRandomString();
  if (!req.cookies["user_id"]) {
    return res.send("You cannot shorten links without creating an account");
  }
  urlDatabase[id] = {longURL: req.body.longURL, userID: req.cookies["user_id"]};
  res.redirect(`/urls/${id}`);
})

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
})

app.post("/urls/:id", (req, res) => {
  if (urlDatabase[req.params.id] && urlDatabase[req.params.id].userID === req.cookies["user_id"]) {
    urlDatabase[req.params.id] = {longURL: req.body.longURL, userID: req.cookies["user_id"]};
  }
  return res.redirect("/urls");;
})

app.get("/urls/:id", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.send("You must log in first before you can access this page")
  }
  if (urlDatabase[req.params.id] && urlDatabase[req.params.id].userID === req.cookies["user_id"]) {
    const templateVars = {id: req.params.id, urls: urlDatabase[req.params.id], users, cookie: req.cookies["user_id"]};
        return res.render("urls_show", templateVars);
  }
  return res.send("You do not have permission to access this URL");
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

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
})

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello<b>World</b></body></html>\n");
})

app.listen(PORT, () => {
  console.log(`Example app is listening on port ${PORT}`);
});

