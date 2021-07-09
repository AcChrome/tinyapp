const { assert } = require('chai');
const { findEmail, getUser } = require('../helpers.js');

const testUsers = {
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


describe('findEmail', function() {
  it('should return a user with valid email', function() {
    const user = findEmail("user@example.com", testUsers)
    const expectedOutput = {
      id: "userRandomID", 
      email: "user@example.com", 
      password: "purple-monkey-dinosaur"
    };
    assert.deepEqual(user, expectedOutput);
  });

  it('should not return a user with invalid email', function() {
    const user = findEmail( "", testUsers)
    const expectedOutput = null;
    assert.deepEqual(user, expectedOutput);
  });
});
