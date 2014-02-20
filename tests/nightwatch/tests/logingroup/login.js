module.exports = {
  "S3 Progress Tests - Login" : function (client) {
    client
      .url("http://localhost:3000")
      .waitForElementVisible("body", 1000)
      .assert.title("S3 Progress Example")
      .pause(1000)
      .assert.visible("li#login-dropdown-list")
      .click("li#login-dropdown-list a")
      .assert.visible("div.dropdown-menu")
      .setValue("input#login-email", 'test@example.com')
      .setValue("input#login-password", "testing")
      .click("button#login-buttons-password")
      .pause(1000)
      .assert.containsText("li#login-dropdown-list a", "test@example.com")
      .end();
  }
};