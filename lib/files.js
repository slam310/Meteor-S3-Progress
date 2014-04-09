if(Meteor.isServer){
  Knox = Npm.require("knox");
  var Future = Npm.require('fibers/future');
  var streamBuffers = Npm.require("stream-buffers");
}


Files = {};

Files.noConfig = function(){
  var existing_global_config = S3config.findOne({type: 'global'});
  if(existing_global_config){
    return false;
  } else {
    return true;
  }
};

Files.useUserRole = function(){
  var s3config = S3config.findOne({type: 'global'});
  if(!s3config)
    return;
  if(typeof s3config.use_user_role == 'undefined')
    return;
  if(Roles.userIsInRole(Meteor.userId(), ['s3_admin'])){
    return true;
  } else if(s3config.use_user_role == 'on' && Roles.userIsInRole(Meteor.userId(), ['s3_user'])) {
    return true;
  } else if(s3config.use_user_role == 'off') {
    return true;
  } else {
    return false;
  }
};

Files.getS3Config = function(){
  var user_id = this.userId;
  var user = Meteor.users.findOne({_id: user_id});
  var s3config;
  var s3config_user = S3config.findOne({user_id: user_id});
  if(typeof s3config_user == 'object'){
    s3config = s3config_user
  } else {
    s3config = S3config.findOne({type: 'global'});
  }

  return s3config;
};

Files.RemoveAdminRole = function(user_id){
  if(this.userId == user_id){
    throw new Meteor.Error(304, "You cannot modify your own record");
  }

  if(!Roles.userIsInRole(this.userId, ['s3_admin'])){
    throw new Meteor.Error(401, "You must be an S3 admin to perform this request.");
  }

  Roles.removeUsersFromRoles(user_id, 's3_admin');
};

Files.AddAdminRole = function(user_id){
  if(this.userId == user_id){
    throw new Meteor.Error(304, "You cannot modify your own record");
  }

  if(!Roles.userIsInRole(this.userId, ['s3_admin'])){
    throw new Meteor.Error(401, "You must be an S3 admin to perform this request.");
  }

  Roles.addUsersToRoles(user_id, 's3_admin');
};

Files.RemoveUserRole = function(user_id){
  if(this.userId == user_id){
    throw new Meteor.Error(304, "You cannot modify your own record");
  }

  if(!Roles.userIsInRole(this.userId, ['s3_admin'])){
    throw new Meteor.Error(401, "You must be an S3 admin to perform this request.");
  }

  Roles.removeUsersFromRoles(user_id, 's3_user');
};

Files.AddUserRole = function(user_id){
  if(this.userId == user_id){
    throw new Meteor.Error(304, "You cannot modify your own record");
  }

  if(!Roles.userIsInRole(this.userId, ['s3_admin'])){
    throw new Meteor.Error(401, "You must be an S3 admin to perform this request.");
  }

  Roles.addUsersToRoles(user_id, 's3_user');
};

Files.ConfigSave = function(obj) {
  if(obj._id){
    var _id = obj._id;
    delete obj._id;
    S3config.update({_id: _id},{$set: obj});
  } else {
    S3config.insert(obj);
  }
};

Files.AdminConfigSave = function(obj){
  // The application global configuration is special.
  // We need to see if one exists. There can be only ONE.
  var global = S3config.findOne({type: 'global'});

  // If we have a global object then we just need to update it with the new settings.
  // Otherwise we need to add the type of 'global' and create a new one.
  if(global){
    Files.ConfigSave(obj);
  } else {
    obj.type = 'global';
    Files.ConfigSave(obj);
  }
};

Files.Upload = function(options){
  var user_id = this.userId;
  var s3config = Files.getS3Config();

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
};

Files.Delete = function(file_id, callback){
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
};

Files.List = function(path){
  var future = new Future();
  knox.list({prefix: path}, function(err, data){
    if(err)
      console.log(err)
    if(data)
      future.return(data)
  });

  var files = future.wait();
  return files;
};