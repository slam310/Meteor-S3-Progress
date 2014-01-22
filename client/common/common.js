Meteor.subscribe('s3files');
Meteor.subscribe('s3_global_config');
Meteor.subscribe('s3config');
Meteor.subscribe('s3_admin_users');
Meteor.subscribe('s3_users');

noConfig = function(){
  var existing_global_config = S3config.findOne({type: 'global'});
  if(existing_global_config){
    return false;
  } else {
    return true;
  }
}