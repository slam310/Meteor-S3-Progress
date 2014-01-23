Package.describe({
  summary: "Upload files to S3. Allows use of Knox Server-Side and get files urls on client-side."
});

var both = ["client", "server"];

Npm.depends({
  knox: "0.8.5",
  "stream-buffers": "0.2.5"
});

Package.on_use(function (api) {
  //Need service-configuration to use Meteor.method
  api.use([
    "underscore",
    "ejson",
    "service-configuration",
    'templating',
    'collection-hooks',
    'momentjs',
    "accounts-base",
    "coffeescript",
    "roles",
    "bootboxjs"
    ], ["client", "server"]);
  // api.use(["handlebars", "spark", "bootboxjs"], "client");
  api.add_files([
    'client/common/common.html',
    'client/common/common.js',
    'client/views/s3admin/admin.html',
    'client/views/s3admin/admin.js',
    'client/views/s3upload/upload.html',
    'client/views/s3upload/upload.js',
    'client/views/s3user/user.html',
    'client/views/s3user/user.js',
    "s3.css"
    ], "client");
  api.add_files(["server/s3server.js"], "server");

  // Collections shared by both client and server.
  api.add_files([
    'collection/s3config.js',
    'collection/s3files.js'
    ],both);

  //Allows user access to Knox
  api.export && api.export("Knox","server");
  api.export && api.export(["S3files","S3config"],["client", "server"]);
});
