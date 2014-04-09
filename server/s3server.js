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

Meteor.publish('s3files', function(user){
  if(!user)
    return;
  var _user_id = user._id;
  if(Roles.userIsInRole(_user_id, ['s3_admin'])) {
    return S3files.find({});
  } else {
    return S3files.find({user: _user_id})
  }
});

Meteor.publish('s3_global_config', function(){
  if(Roles.userIsInRole(this.userId, ['s3_admin'])) {
    return S3config.find({});
  } else {
    return S3config.find({},{fields: {type: 1, allow_user_config: 1, use_user_role: 1}});
  }
});

Meteor.publish('s3_all_users', function(user){
  if(!user)
    return;
  var _user_id = user._id;
  if(Roles.userIsInRole(_user_id, ['s3_admin'])) {
    return Meteor.users.find({});
  }
});

Meteor.publish('s3config', function(){
  return S3config.find({user: this.userId, type: {$ne: 'global'}})
});

Meteor.publish('s3_admin_users', function(user){
  if(!user)
    return;
  var _user_id = user._id;
  if(_user_id && Roles.userIsInRole(_user_id, ['s3_admin'])) {
    return Roles.getUsersInRole(['s3_admin']);
  }
});

Meteor.publish('s3_users', function(){
  if(Roles.userIsInRole(this.userId, ['s3_admin'])) {
    return Roles.getUsersInRole(['s3_user']);
  }
});

Meteor.methods({
  S3RemoveAdminRole: Files.RemoveAdminRole,
  S3RemoveUserRole: Files.RemoveUserRole,
  S3AddUserRole: Files.AddUserRole,
  S3AddAdminRole: Files.AddAdminRole,
  AddS3AdminRole: function(user){
    if(typeof user.username == 'string'){
      var user = Meteor.users.findOne({username: user.username});
      Roles.addUsersToRoles(user._id,['s3_admin']);
    }
  },
  S3ConfigSave: Files.ConfigSave,
  S3AdminConfig: Files.AdminConfigSave,
  S3upload: Files.Upload,
  S3delete: Files.Delete,
  S3list: Files.List
});
