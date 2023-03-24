const bcryptjs = require('bcryptjs');
const password = "monkeyfuzz";
const hashedPassword = bcryptjs.hashSync(password,10);

console.log(password, hashedPassword);