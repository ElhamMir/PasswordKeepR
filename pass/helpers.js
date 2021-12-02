
//returns the user with the email address
function getUserByEmail(email,usersDatabase) {
  for (const user in usersDatabase) {
    if (usersDatabase[user].email === email) {
      return user;
    }
  }
  return null;
}

//generates a random string
function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
}





  
module.exports = {
  getUserByEmail,
  generateRandomString
};