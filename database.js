// ========================== "Databases" ==========================
const bcryptjs = require('bcryptjs');

const urlDatabase = {
  "b2xVn2": {longURL : "http://www.lighthouselabs.ca", userID: "aJ48lW"},
  "9sm5xK": {longURL : "http://www.google.com", userID: "aJ48lW"},
  "0sm5xK": {longURL : "http://www.hello.com", userID: "aa48lW"}
};

const users = {
  aJ48lW: {
    id: "aJ48lW",
    email: "a@a.com",
    password: bcryptjs.hashSync("a", 10),
  },
  aa48lW: {
    id: "aa48lW",
    email: "b@b.com",
    password: bcryptjs.hashSync("b", 10),
  },
}

module.exports = {urlDatabase, users};