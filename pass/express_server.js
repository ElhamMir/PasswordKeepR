const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const {getUserByEmail, generateRandomString} = require("./helpers");
//const e = require("express");

const app = express();
const PORT = 8080; // default port 8080

app.use(express.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['hello'],
  maxAge: 24 * 60 * 60 * 1000// 24 hours
}));

app.set("view engine", "ejs");


const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID",
    pass: "here"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "userRandomID",
    pass: "here"
  }
};


const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "1"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};
let isUc ;
let isLc ;
let num ;
let category;
//helper function, returns all urls for a specfic user usi ng user id
const urlsForUser = function(userId,urlDatabase) {
  const urls = {};
  for (const shrtUrl in urlDatabase) {
    if (urlDatabase[shrtUrl].userID === userId) {
      urls[shrtUrl] = urlDatabase[shrtUrl];
    }
  }
  return urls;
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

app.get("/urls", (req, res) => {
  const username = req.session.user_id;
  const email = req.session.email;
  
  const templateVars = {
    urls: urlsForUser(username,urlDatabase) ,
    username,
    user: users[username],
    email
   
  };
  console.log(users[username],username);
  res.render("urls_index", templateVars);
});

//page for making a new url
app.get("/urls/new", (req, res) => {
  const username = req.session.user_id;
  const email = req.session.email;
  if (!username) {
    return res.redirect("/login");
  }
  const templateVars = {
    username,
    email
  };
  res.render("urls_new",templateVars);
});

//link to a short url
app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.shortURL;
  const email = req.session.email;
  if (!userId) {
    console.log("user is invalid");
    res.status(400).send("You do not have permission to visit this page");
    
  } else if (!urlDatabase[req.params.shortURL]) {
    res.status(400).send("You do not have permission to visit this page");
  } else {
    const templateVars = {
      shortURL,
      longURL:urlDatabase[shortURL].longURL,
      username: req.session.user_id,
      email
    };
    res.render("urls_show", templateVars);
    
  }
});


app.post("/urls", (req, res) => {
  
  let cate = req.body.cat;
  console.log("cate",cate)
  const userId = req.session.user_id;
  let character = "";
  if (!userId) {
    res.redirect("/login");
  }
  if (req.body.customCheck1 === "on") {
    isUc = true;
    character += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  }
  if (req.body.customCheck2 === "on") {
    isLc = true;
    character += "abcdefghijklmnopqrstuvwxyz"
  }
  if (req.body.customCheck3 === "on") {
    num = true;
    character += "0123456789";
  }
  if (req.body.customCheck4 === "on") {
    
    character += "^&*+=";
  }
  if (cate === "1") {
    category = "Social";
  } else if (cate === "2"){
    category = "Work";
  } else {
    category = "Entertainment";
  }

  let numb = req.body.longURL1;
  
  
  console.log("this",numb)
  console.log("THis here", req.body.customCheck1)
  console.log("THis here", req.body.customCheck2)
  console.log("THis here", req.body.customCheck3)
  shortURL = "";
  let x = character.length;
  for (let i = 0; i < numb; i ++) {
    shortURL += character.charAt(Math.floor(Math.random() * 
    x));
  }
 
  console.log(shortURL, "hererer");
  //let shortURL = generateRandom();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: userId,
    pass: shortURL,
    org: category
  };
  res.redirect("/urls");
});



app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

//deletes the url
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL].longURL;
  delete urlDatabase[req.params.shortURL].pass;

  res.redirect("/urls");
});

//edit the short url
app.post("/urls/:shortURL/edit", (req, res) => {
  urlDatabase[req.params.shortURL].pass = req.body.longURL;
  console.log('Thissss',urlDatabase[req.params.shortURL].pass)
  //urlDatabase[req.params.shortURL].longURL1
  res.redirect("/urls");
});


//login
app.get("/login", (req, res) => {
  const username = req.session["user"];
  const email = req.body.email;
  if (username) {
    return res.redirect("/urls");
  }
  const templateVars = {
    username: null,
    email
  };
  
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email,users);
  if (!user) {
    return res.status(401).send("No User");
  } else if (!bcrypt.compareSync(password,users[user].password)) {
    return res.status(401).send("Invalid Username or Password");
  }
  req.session["user_id"] = user;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  const templateVars = {
    username: null
  };
  res.render("register",templateVars);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const userPass = req.body.password;

  if (!email || !userPass) {
    return res.send("Email or password is missing.");
  }
  if (getUserByEmail(email,users)) {
    return res.status(401).send("A user with this email already exists.");
  }
  const userId = generateRandomString();
  const newUser = {
    id:userId,
    email: email,
    password: bcrypt.hashSync(userPass,10)
    
  };
  users[userId] = newUser;
  req.session.user_id = userId;
  req.session.email = email;
  res.redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
