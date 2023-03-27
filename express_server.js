// ========================== Modules ==========================
const express = require('express');
const bcryptjs = require('bcryptjs');
let cookieSession = require('cookie-session');
const { getUserByEmail, generateRandomString, urlsForUser } = require('./helpers');
const { urlDatabase, users } = require('./database');
const app = express();
const PORT = 8080;

// ========================== Middleware ==========================
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'userID',
  keys: ["secret"],
}));

// ========================== Endpoints ==========================
app.get("/", (req, res) => {
  // If the user is NOT logged in, redirect to /login
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  // If the user is logged in, redirect to /urls
  return res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const templateVars = {users, cookie: req.session.user_id};
  // If the user is logged in, redirect to /urls
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  // If the user is NOT logged in, render the urls_login view template
  return res.render("urls_login", templateVars)
})

app.post("/login", (req, res) => {
  let user = getUserByEmail(req.body.email, users);
  
  // If the email or password from the form has no value, send a status 400 with a message
  if (req.body.email === '' || req.body.password === '') {
    return res.status(400).send("Email or Password not available");
  }
  
  // If plaintext password is equals to hashed password, set id key of user as cookie
  if (bcryptjs.compareSync(req.body.password, user.password)) {
    req.session.user_id = user.id
    return res.redirect("/urls");
  }
  
  // If user entered an email that isn't registered or an existing email account but wrong password, send a status code 403 with a message
  return res.status(403).send("Incorrect email or password");
})

app.post("/logout", (req, res) => {
  // Clears the userID cookies and redirects to /login
  res.clearCookie('userID');
  res.clearCookie('userID.sig');
  return res.redirect("/login");
})

app.post("/register", (req, res) => {
  let id = generateRandomString();
  let user = getUserByEmail(req.body.email, users);

  // If the email or password from the form has no value, send a status 400 with a message
  if (req.body.email === '' || req.body.password === '') {
    return res.status(400).send("Email or Password not available");
  }
  
  // If the user entered an email that isn't registered on the database, create a new key value pair with details for a new user account
  if (user === undefined) {
    // Sets the key and the id as the return value of the generateRandomString function, email as the value from the form and the password but it is hashed.
    users[id] = {id: id, email: req.body.email, password: bcryptjs.hashSync(req.body.password, 10)};
    req.session.user_id = users[id].id;
    return res.redirect("/urls");
  }

  // If the email the user entered was already registered on the database, send a status code 400 with a message
  if (user.email === req.body.email) {
    return res.status(400).send("Email already registered");
  }

});

app.get("/register", (req, res) => {
  // If the user is logged in, redirect to /urls
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  // If the user is NOT logged in, render the urls_register view template
  const templateVars = {users, cookie: req.session.user_id};
  return res.render("urls_register", templateVars);
})

app.get("/urls", (req, res) => {
  const templateVars = {urls: urlsForUser(req.session.user_id, urlDatabase), users, cookie: req.session.user_id};
  // If the user is NOT logged in, send a message as a response
  if (!req.session.user_id) {
    return res.send("You must be logged in to see and create shortened URLs.");
  }
  // If the user is logged in, render the urls_index view template
  return res.render("urls_index", templateVars);
})

app.get("/urls/new", (req, res) => {
  const templateVars = {users, cookie: req.session.user_id};
  // If the user is NOT logged in, redirect to /login
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  // If the user is logged in, render the urls_new view template
  return res.render("urls_new", templateVars);
})

app.post("/urls", (req, res) => {
  let id = generateRandomString();
  // If the user is NOT logged in, send a message as a response
  if (!req.session.user_id) {
    return res.send("You cannot shorten links without creating an account");
  }
  // Sets the key in the urlDatabase as the return value of the generateRandomString function and the value as the longURL as the url received from the form and the userID as the cookie.
  urlDatabase[id] = {longURL: req.body.longURL, userID: req.session.user_id};
  return res.redirect(`/urls/${id}`);
})

app.post("/urls/:id/delete", (req, res) => {
  // If the url does not exist in the Database
  if (!urlDatabase[req.params.id]) {
    return res.send("This URL link does not exist!")
  }
  // If the user is not logged in, send a message
  if (!req.session.user_id) {
    return res.send("You must be logged in to delete this URL");
  }
  // If the urlDatabase key and the urlDatabase key's userID are not equal to the cookie.
  if (urlDatabase[req.params.id] && urlDatabase[req.params.id].userID !== req.session.user_id) {
    return res.send("You cannot delete this link without being the owner");
  }
  // If the user is logged in and owns the URL, deletes this url object from the database and redirect to /urls
  delete urlDatabase[req.params.id];
  return res.redirect("/urls");
})

app.post("/urls/:id", (req, res) => {
  // If the urlDatabase key value pair does not exist, send a message
  if (!urlDatabase[req.params.id]) {
    return res.send("This URL link does not exist!")
  }
  // If the user is not logged in, send a message
  if (!req.session.user_id) {
    return res.send("You must be logged in to edit this URL");
  }
  // If the urlDatabase key and the urlDatabase key's userID are not equal to the cookie, send a message
  if (urlDatabase[req.params.id] && urlDatabase[req.params.id].userID !== req.session.user_id) {
    return res.send("You cannot edit this link without being the owner");
  }
  // Sets the key in the urlDatabase as the params id in the search bar and the value as the longURL as the url received from the form and the userID as the cookie and redirect to /urls
  urlDatabase[req.params.id] = {longURL: req.body.longURL, userID: req.session.user_id};
  return res.redirect("/urls");
})

app.get("/urls/:id", (req, res) => {
  // If the user is not logged in, send a message
  if (!req.session.user_id) {
    return res.send("You must log in first before you can access this URL page")
  }
  // If the URL exists in the urlDatabase AND it is equals to the user_id cookie, render the urls_show view template
  if (urlDatabase[req.params.id] && urlDatabase[req.params.id].userID === req.session.user_id) {
    const templateVars = {id: req.params.id, urls: urlDatabase[req.params.id], users, cookie: req.session.user_id};
    return res.render("urls_show", templateVars);
  }
  // If the URL cookie does not match the userID, send a message
  return res.send("You do not have permission to edit this URL");
})

app.get("/u/:id", (req, res) => {
  // For every URL in urlDatabase object, if the URL matches the dynamic id in the browser URL, redirect to the longURL value of that URL object
  for (let url in urlDatabase) {
    if (url === req.params.id) {
      const longURL = urlDatabase[url].longURL;
      return res.redirect(longURL);
    }
  }
  // If the URL does not match, send a message
  return res.send("This short link does not exist");
})

// ========================== Listener ==========================
app.listen(PORT, () => {
  console.log(`Example app is listening on port ${PORT}`);
});

