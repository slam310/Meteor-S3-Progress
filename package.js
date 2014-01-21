Package.describe({
  summary: "Upload files to S3. Allows use of Knox Server-Side and get files urls on client-side."
});

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
    "accounts-password",
    "accounts-ui",
    "coffeescript",
    "roles",
    "bootstrap-3",
    "bootstrap-3-switch"
    ], ["client", "server"]);
  api.use(["handlebars", "spark", "bootboxjs"], "client");
  api.add_files(["s3templates.html", "s3client.js","s3.css"], "client");
  api.add_files(["s3server.js"], "server");
  api.add_files("s3collection.js",["client", "server"]);

  //Allows user access to Knox
  api.export && api.export("Knox","server");
  api.export && api.export(["S3files","S3config"],["client", "server"]);
});
