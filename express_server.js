var express = require("express");
var morgan  = require('morgan');
var cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
var cookieSession = require('cookie-session');
var app = express();
var PORT = 8080; // default port 8080
app.set("view engine", "ejs");


const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['dj khaled we da bes'],
 
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));


var urlDatabase = {
  "b2xVn2": {
    long: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    long: "http://www.google.com",
    userID: "user2RandomID"
  },
  
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};


function generateRandomString() {
var alphaString = Math.random().toString(32).replace('0.', '');

return alphaString.slice(0,6);
}

// Register Users page
app.get("/register", (req, res) => {
  
  res.render("urls_register");
});
// captures users info and saves a cookie
app.post("/register", (req, res) => {
  let user_ID = generateRandomString();
  
  let email = req.body.email;
  let password = req.body.password;
  let id = user_ID;  
  
 for(let key in users){
   if( users[key].email === email){
    res.status(403).send("Error 403 - The email you used already exist.");
   }
 }  
    
if(email === undefined || password === undefined){
  res.status(400).send("Error 400 - You must enter a Username and Password.");
} else if(email === '' || password === ''){
  res.status(400).send("Error 400 - You must enter a Username and Password.");
} else if(users[email]){ // I didn't find the user (+ If I found the user but the password didn't match)
  res.status(400).send("Error 400 - You must enter a new password.");
} else {
  const hashedPassword = bcrypt.hashSync(password, 10);

  users[id] = { id: user_ID,
    email: email,
    password: hashedPassword
  };
  req.session.user_id = user_ID;
  

  res.redirect("/urls/");}

  });

// Login page 

app.get("/login", (req, res) => {
  
  const data = users[req.session.userID];
  
  
  //users.id.email
  res.render('login');

});

// Log out of session
app.post("/logout", (req, res) => {
  
  req.session.user_id = null;
  res.redirect("/login");
  
});


// Sets the login cookie
app.post("/login", (req, res) => {
 
  const email = req.body.email;
  const password = req.body.password;
  var validUser = null;
  
  for(let key in users){

    if(email === users[key].email && bcrypt.compareSync(password, users[key].password)){
    
      validUser = users[key];
 
    }
  } 
    if(validUser){
      req.session.user_id = validUser.id;
      res.redirect("/urls");
    } else if(!validUser){
      res.status(400).send("Error 400 - Unable to log in.");

    }
   

});

// Delete from database
app.post("/urls/:id/delete", (req, res) => {
  
  let shortUrl = req.params.id;
  let loggedIn = req.session.user_id;
  let urlOwner = urlDatabase[shortUrl].userID;

  if(loggedIn === urlOwner){
  delete urlDatabase[req.params.id];
  res.redirect("/urls/");
 } else if(loggedIn != urlOwner){
  res.status(400).send("Error 400 - Only the owner of this url is allowed to delete it.");

 }

});

// This post updates the url from the individual url page
app.post("/urls/:id", (req, res) => {

let urlOwner = urlDatabase[req.params.id].userID;
let loggedIn = req.session.user_id;

if(loggedIn === urlOwner){
  urlDatabase[req.params.id].long = req.body.newlongURL;

  res.redirect("/urls/");
 } else if(loggedIn != urlOwner){
  res.status(400).send("Error 400 - Only the owner of this url is allowed to edit it.");
 } 

});
// Helper function checking user ids 
function urlsForUser(userID){
  let foundInfo = {};
  for(let key in urlDatabase){
    let userIdForUrl = urlDatabase[key].userID;
      
    if(userIdForUrl === userID){ 
      foundInfo[key] = {
        userID: urlDatabase[key].userID,
        long: urlDatabase[key].long
      };
    }
  } 
  return foundInfo;
}


// This get take me to the urls page with the list
app.get("/urls", (req, res) => {
  let userId = req.session.user_id;
  let emailDisplay = users[userId].email;
  let templateVars = {
    
    username: emailDisplay,
    urls: urlsForUser(userId)
  };

 res.render("urls_index", templateVars);
});

//This gets the urls/new page
app.get("/urls/new", (req, res) => {
  let templateVars = {username: req.session.user_id};
  var shortURL = generateRandomString();
  var longURL = req.body.longURL;
  
let userId = req.session.user_id;
 
let validUser = userId;

if(validUser === undefined){
  res.redirect("/login");
} else if (validUser){
  res.render("urls_new", templateVars);
}

  
});

// When you hit the edit button you are taken to the indivual link page to make the edit
app.get("/urls/:id", (req, res) => {
  let templateVars = { 
    shortURL: req.params.id,
    urls: urlDatabase,
    longURL: urlDatabase[req.params.id],
    username: req.session.user_id,  
    };
  res.render("urls_show", templateVars);
});

// Come back and fix. This is suppose to redirect a user from the short url and open up the website of it longurl. 
app.get("/u/:shortURL", (req, res) => {

let longURL = urlDatabase[req.params.shortURL].long;


  res.redirect(longURL);
});

// This takes the full url and whatever is submitted is sent to the urls_show page and generating a random 
// alphanumeric string for the short url

app.post("/urls", (req, res) => {
  var shortURL = generateRandomString();
 // var longURL = urlDatabase;
  urlDatabase[shortURL] = {
    long: req.body.longURL ,
    userID: req.session.user_id
  };
console.log(urlDatabase);
  res.redirect("/urls/");

});

// Port listening on localhost
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});