Knox = Npm.require("knox");
var Future = Npm.require('fibers/future');
var streamBuffers = Npm.require("stream-buffers");


// Setup the roles for use with this package.
Meteor.startup(function(){
  var s3_roles = ['s3_admin', 's3_user'];
  var all_roles = Roles.getAllRoles().fetch();
  _.each(s3_roles, function(s3_role){
    var role_exists = false;
    _.each(all_roles, function(role){
      if(role.name == s3_role){
        role_exists = true
      }
    });
    if(role_exists == false) {
      Roles.createRole(s3_role);
    }
  });
});

// Publish all the roles to the client per the Roles package documentation.
Meteor.publish(null, function (){
  return Meteor.roles.find({})
});

Meteor.publish('s3files', function(){
  if(Roles.userIsInRole(this.userId, ['s3_admin'])) {
    return S3files.find();
  } else {
    return S3files.find({user: this.userId})
  }
});

Meteor.publish('s3_global_config', function(){
  if(Roles.userIsInRole(this.userId, ['s3_admin'])) {
    return S3config.find({});
  } else {
    return S3config.find({},{fields: {type: 1, allow_user_config: 1}});
  }
});

Meteor.publish('s3_all_users', function(){
  if(Roles.userIsInRole(this.userId, ['s3_admin'])) {
    return Meteor.users.find({});
  }
});

Meteor.publish('s3config', function(){
  return S3config.find({user: this.userId, type: {$ne: 'global'}})
});

Meteor.publish('s3_admin_users', function(){
  if(Roles.userIsInRole(this.userId, ['s3_admin'])) {
    return Roles.getUsersInRole(['s3_admin']);
  }
});

Meteor.publish('s3_users', function(){
  if(Roles.userIsInRole(this.userId, ['s3_admin'])) {
    return Roles.getUsersInRole(['s3_user']);
  }
});

Meteor.methods({
  AddS3AdminRole: function(user){
    if(typeof user.username == 'string'){
      var user = Meteor.users.findOne({username: user.username});
      Roles.addUsersToRoles(user._id,['s3_admin']);
    }
  },
  S3ConfigSave: function(obj) {
    if(obj._id){
      var _id = obj._id;
      delete obj._id;
      S3config.update({_id: _id},{$set: obj});
    } else {
      S3config.insert(obj);
    }
  },
  S3config:function(obj){
    var global = S3config.findOne({type: 'global'})
    if(global){
      obj.type = 'global';
      S3config.update({type: 'global'}, {$set: obj})
    } else {
      S3config.insert(obj)
    }
  },
  S3upload:function(options){
    var user_id = Meteor.userId();
    var user = Meteor.users.findOne({_id: user_id});
    var s3config;
    var s3config_user = S3config.findOne({user_id: user_id});
    if(typeof s3config_user == 'object'){
      s3config = s3config_user
    } else {
      s3config = S3config.findOne({type: 'global'});
    }

    var knox = Knox.createClient(s3config);
    var file = options.file;
    var context = options.context;
    var callback = options.callback;
    var path;

    var file_stream_buffer = new streamBuffers.ReadableStreamBuffer({
      frequency: 10,       // in milliseconds.
      chunkSize: 2048     // in bytes.
    });

    var future = new Future();

    path = s3config.directory + user_id + '/' + file.name;

    S3files.upsert({file_name: file.name},{
      user: user_id,
      file_name: file.name,
      size: file.size,
      mime_type: file.type,
      original_name: file.originalName,
      path: path,
      s3_config_id: s3config._id
    });

    var buffer = new Buffer(file.data);
    file_stream_buffer.put(buffer);
    var headers = {
      "Content-Type":   file.type,
      "Content-Length": buffer.length
    }

    var put = knox.putStream(file_stream_buffer,path,headers,function(e,r){
      if(r){
        future.return(path);
      }
      if(e) {
        console.log('There was an error...', e);
      }
    });

    put.on('progress', Meteor.bindEnvironment(function(progress){
        S3files.update({file_name: file.name}, {$set: {percent_uploaded: progress.percent}});
      })
    );

    put.on('error', Meteor.bindEnvironment(function(error){
        console.log("Error Call: ", error)
        S3files.update({file_name: file.name}, {$set: {error: true}});
      })
    );

    var url = knox.http(future.wait());
    if(url != null){
      S3files.update({file_name: file.name}, {$set: {url: url}});
      if(typeof callback == 'string'){
        Meteor.call(callback,url,context);
      }
    }
  },
  S3delete:function(file_id, callback){
    var file = S3files.findOne({_id: file_id});
    var s3config = S3config.findOne({_id: file.s3_config_id});
    if(typeof s3config == 'undefined'){
      s3config = S3config.findOne({type: 'global'});
    }
    var knox = Knox.createClient(s3config);
    var path = file.user + "/" + file.file_name;
    S3files.remove({_id: file_id});
    knox.deleteFile(path, function(e,r) {
      if(e){
        console.log(e);
      } else if(callback){
        Meteor.call(callback);
      }
    });
  },
  S3list: function(path){
    var future = new Future();
    knox.list({prefix: path}, function(err, data){
      if(err)
        console.log(err)
      if(data)
        future.return(data)
    });

    var files = future.wait();
    return files;
  }

});
