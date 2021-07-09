const findEmail = (email, database) => {
  console.log("databasefindemail:", database);
  for (const usersId in database) {
    const user = database[usersId];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};


module.exports = {
  findEmail
};
