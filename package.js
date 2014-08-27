Package.describe({
  summary: 'Upload files to Files. Allows use of Knox Server-Side and get files urls on client-side.',
  version: "1.6.0",
  git: "https://github.com/digilord/Meteor-S3-Progress.git"
  name: "digilord:s3-progress"
});

var both = ['client', 'server'];

Npm.depends({
  knox: '0.8.5',
  'stream-buffers': '0.2.5'
});

Package.on_use(function (api) {
  api.versionsFrom("METEOR@0.9.0");
  //Need service-configuration to use Meteor.method
  api.use('underscore');
  api.use('templating');
  api.use('coffeescript');
  api.use('accounts-base');
  api.use('deps');
  api.use('matb33:collection-hooks');
  api.use('mrt:moment');
  api.use('digilord:roles');
  api.use('mizzao:bootboxjs');
  
  // Collections shared by both client and server.
  api.add_files([
    'lib/files.js',
    'collection/s3config.js',
    'collection/s3files.js'
    ],both);
  api.add_files([
    'client/common/common.html',
    'client/common/common.js',
    'client/views/s3admin/admin.html',
    'client/views/s3admin/admin.js',
    'client/views/s3upload/upload.html',
    'client/views/s3upload/upload.js',
    'client/views/s3user/user.html',
    'client/views/s3user/user.js',
    's3.css'
    ], 'client');
  api.add_files([
    'client/common/cors_configuration.handlebars',
    'client/common/bucket_policy_configuration.handlebars',
    'server/s3server.js',
    'server/s3_user_hooks.js'
    ], 'server');



  // Allows user access to Knox
  if(api.export) {
    api.export('Knox','server');
    api.export(['S3files','S3config', 'S3'],['client', 'server']);
  }
});
