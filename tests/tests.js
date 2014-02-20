var inspect = Npm.require("util").inspect;
var should = Npm.require("should");

console.log(inspect(Meteor));
Tinytest.add("S3 - Package", function(test){
  test.isTrue(true);
});

Tinytest.add("S3 - S3Files", function(test){
  test.isTrue(typeof S3Files !== "undefined", "S3Files should exist");
});

Tinytest.add("S3 - S3Config", function(test){
  test.isTrue(typeof S3Config !== "undefined", "S3Config should exist");
});