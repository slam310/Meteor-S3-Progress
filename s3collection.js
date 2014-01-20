S3files = new Meteor.Collection("s3files");
S3config = new Meteor.Collection("s3config");

S3files.before.insert(function (userId, doc) {
  doc.createdAt = Date.now();
});

S3files.before.update(function (userId, doc, fieldNames, modifier, options) {
  modifier.$set.modifiedAt = Date.now();
});

S3config.before.insert(function (userId, doc) {
  doc.createdAt = Date.now();
});

S3config.before.update(function (userId, doc, fieldNames, modifier, options) {
  modifier.$set.modifiedAt = Date.now();
});