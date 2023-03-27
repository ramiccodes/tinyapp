// ========================== Functions =========================

const getUserByEmail = (email, database) => {
  for (const key in database) {
    if (database[key].email === email) {
      return database[key];
    }
  }
}

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

const urlsForUser = (id, database) => {
  let urls = {}
  for (const url in database) {
    if (database[url].userID === id) {
      urls[url] = database[url];
    }
  }
  return urls;
}

module.exports = {getUserByEmail, generateRandomString, urlsForUser};