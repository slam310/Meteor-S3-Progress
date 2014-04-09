var loginTest = require("../../lib/login").login;

module.exports = {
  setUp : function(c) {
    console.log('Setting up...');
  },
  
  tearDown : function() {
    console.log('Closing down...');
  },

  "S3 Progress Tests - Login" : function (client) {
    loginTest(client)
      .end();
  }
};