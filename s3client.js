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


Template.s3upload.helpers({
  noUploads: function(){
    var s3_file_name = Session.get('s3-file-name');
    if(s3_file_name == null || typeof s3_file_name == 'undefined') {
      return true;
    } else {
      return false;
    }
  },
  s3private: function(){
    var s3config_user = S3config.findOne({user_id: Meteor.userId()});
    if(typeof s3config_user == 'object'){
      return true;
    } else {
      return false;
    }
  },
  noConfig: noConfig
});

Template.s3upload.events({
  'change input[type=file]': function (event,template) {
    var files = event.currentTarget.files;
    $('.s3-file-upload-button').addClass('disabled');
    $('.s3-file-upload-button').text('Preparing to transfer file...');
    _.each(files,function(file){
      var reader = new FileReader;
      var fileData = {
        name:file.name,
        size:file.size,
        type:file.type
      };

      reader.onload = function (e) {
        fileData.data = new Uint8Array(reader.result);
        fileData.originalName = fileData.name;
        var extension = (fileData.name).match(/\.[0-9a-z]{1,5}$/i);
        fileData.name = Meteor.uuid()+extension;
        options = {};
        options.file = fileData;
        Session.set('s3-file-name', fileData.name)
        Meteor.call("S3upload", options)
      };

      reader.readAsArrayBuffer(file);

    });
  },
  'click .s3-file-upload-button': function(e) {
    $('.s3-file-upload').click();
  }
});

Template.s3progress.helpers({
  has_errors: function(){
    var file_name = Session.get('s3-file-name')
    if(file_name != null){
      var file = S3files.findOne({file_name: file_name});
      if(file){
        var error = file.error
        if(error){
          Meteor.setTimeout(function(){
            Session.set('s3-file-name', null);
          },5000);
          $('.s3-file-upload').val(null);
          return true
        } else {
          return false
        }
      }
    } else {
      return false;
    }
  },
  error_class: function(){
    var file_name = Session.get('s3-file-name')
    if(file_name != null){
      var file = S3files.findOne({file_name: file_name});
      if(file){
        var error = file.error
        if(error)
          return 'progress-bar-danger'
      }
    } else {
      return '';
    }
  },
  show_progress: function(){
    var file_name = Session.get('s3-file-name')
    if(file_name != null){
      return true;
    } else {
      return false;
    }
  },
  progress: function () {
    var file_name = Session.get('s3-file-name')
    if(file_name != null){
      var file = S3files.findOne({file_name: file_name});
      if(file){
        var percent = file.percent_uploaded
        if(percent)
          return percent
      }
    } else {
      return 0;
    }
  },
  percent_uploaded_to_browser: function(){
    var file_name = Session.get('s3-file-name')
    if(file_name != null){
      var file = S3files.findOne({file_name: file_name});
      if(file){
        var percent = file.percent_uploaded_to_browser
        if(percent)
          return percent
      }
    } else {
      return 0;
    }
  },
  complete: function() {
    var file_name = Session.get('s3-file-name')
    if(file_name != null){
      var file = S3files.findOne({file_name: file_name});
      if(file){
        var percent = file.percent_uploaded
        if(percent == 100) {
          Meteor.setTimeout(function(){
            Session.set('s3-file-name', null);
          },5000);
          $('.s3-file-upload').val(null);
          return true
        } else {
          return false;
        }
      }
    }
  }
});

Template.s3list_all.helpers({
  noConfig: noConfig,
  all_files: function(){
    return S3files.find().fetch();
  }
});

Template.s3_file_row.helpers({
  name: function(){
    if(this.original_name){
      return this.original_name;
    } else {
      return this.file_name;
    }
  },
  complete: function(){
    if(this.percent_uploaded == 100) {
      return true;
    } else {
      return false;
    }
  },
  processing: function(){
    if(this.percent_uploaded != 100 && this.error != true) {
      return 's3-upload-progressing';
    } else if(this.error){
      return 's3-upload-error';
    } else {
      return '';
    }
  },
  uploaded_ago: function(){
    if(this.percent_uploaded == 100) {
      return moment(this.modifiedAt).fromNow();
    } else {
      return '';
    }
  }
});

Template.s3_file_row.events({
  'click .uploaded-time-ago': function (event, template) {
    var element = $(template.find('.uploaded-time-ago'));
    if(this.percent_uploaded == 100) {
      if(element.hasClass('ago')){
        element.removeClass('ago');
        var html = [];
        html.push('<small>');
        html.push(moment(template.data.modifiedAt).calendar());
        html.push('</small>');
        element.html(html.join(""));
      } else {
        element.addClass('ago');
        var html = [];
        html.push('<small>');
        html.push(moment(template.data.modifiedAt).fromNow());
        html.push('</small>');
        element.html(html.join(""));
      }
    } else {
      return '';
    }
  }
});

Template.s3list_all.events({
  'click .s3-check-all-files': function (event, template) {
    var files = template.findAll('.selected-file');
    var this_button_checked = template.find('.s3-check-all-files').checked;
    _.each(files, function(file){
      file.checked = this_button_checked;
    });
  },
  'click .s3-delete-selected-files': function (event, template) {
    var files = template.findAll('.selected-file');
    var checked_files = [];
    _.each(files, function(file){
      if(file.checked){
        checked_files.push(file.id)
      }
    });

    if(checked_files.length > 0){
      bootbox.confirm("You are about to remove "+ checked_files.length + " files.  This CANNOT BE UNDONE!", function(confirmed) {
        if(confirmed){
          _.each(checked_files, function(file){
            Meteor.call('S3delete', file)
          })
          Session.set('s3-file-name', null)
          // Do something
        }
      });
    }
  },
  'click .selected-file': function (event, template) {
    template.find('.s3-check-all-files').checked = false;
  }
});

Template.s3list_of_user.helpers({
  all_files: function(){
    return S3files.find({user: Meteor.userId()}).fetch();
  }
});

Template.s3list_of_user.events({
  'click .s3-check-all-files': function (event, template) {
    var files = template.findAll('.selected-file');
    var this_button_checked = template.find('.s3-check-all-files').checked;
    _.each(files, function(file){
      file.checked = this_button_checked;
    });
  },
  'click .s3-delete-selected-files': function (event, template) {
    var files = template.findAll('.selected-file');
    var checked_files = [];
    _.each(files, function(file){
      if(file.checked){
        checked_files.push(file.id)
      }
    });

    if(checked_files.length > 0){
      bootbox.confirm("You are about to remove "+ checked_files.length + " files.  This CANNOT BE UNDONE!", function(confirmed) {
        if(confirmed){
          _.each(checked_files, function(file){
            Meteor.call('S3delete', file)
          })

          // Do something
        }
      });
    }
  },
  'click .selected-file': function (event, template) {
    template.find('.s3-check-all-files').checked = false;
  }
});

Template.s3config.helpers({
  noConfig: noConfig,
  noAdminUsers: function(){
    var admin_users = Roles.getUsersInRole('s3_admin').fetch();
    if(admin_users.length == 0 && noConfig()){
      return true;
    } else {
      return false;
    }
  },
  config: function(){
    var existing_global_config = S3config.findOne({type: 'global'});
    return existing_global_config;
  },
  type: function(){
    return global;
  }
});

Template.s3config_form.rendered = function () {
  $('#S3AllowUserConfig').bootstrapSwitch();
};


Template.s3config.events({
  'click #S3ConfigSaveButton': function (event, template) {
    event.preventDefault();

    var form = template.find('form');
    var serialized_form = $(form).serializeArray();
    var s3configObject = {};
    $.each(serialized_form, function(i, v) {
        s3configObject[v.name] = v.value;
    });
    Meteor.call('S3ConfigSave', s3configObject);
  }
});

Template.s3config_no_users.helpers({
  admin_user: function () {
    var admin_user = Session.get('admin_user');
    if(admin_user){
      return admin_user;
    } else {
      return 'username'
    }
  },
  user_exists: function(){
    var admin_user = Session.get('admin_user');
    var user = Meteor.users.findOne({username: admin_user});
    if(user){
      return true;
    } else {
      return false;
    }
  }

});

Template.s3config_no_users.events({
  'keyup #Username': function (event, template) {
    var admin_user = template.find('#Username').value;
    if(admin_user.length > 0){
      Session.set('admin_user', admin_user);
    } else {
      Session.set('admin_user', null);
    }
  },
  'click #CreateS3AdminUser': function(event, template) {
    event.preventDefault();
    var form = template.find('form');
    var serialized_form = $(form).serializeArray();
    var user_object = {};
    $.each(serialized_form, function(i, v) {
        user_object[v.name] = v.value;
        if(v.name == 'username'){
          user_object['email'] = v.value;
        }
    });
    Accounts.createUser(user_object,function(err,result){
      Deps.autorun(function(){
        Meteor.subscribe('s3files');
        Meteor.subscribe('s3_global_config');
        Meteor.subscribe('s3config');
        Meteor.subscribe('s3_admin_users');
        Meteor.subscribe('s3_users');
      });
    });
  },
  'click #AddS3AdminRole': function(event, template) {
    event.preventDefault();
    var form = template.find('form');
    var serialized_form = $(form).serializeArray();
    var user_object = {};
    $.each(serialized_form, function(i, v) {
        user_object[v.name] = v.value;
        if(v.name == 'username'){
          user_object['email'] = v.value;
        }
    });
    Meteor.call('AddS3AdminRole', user_object, function(err,res){
      Deps.autorun(function(){
        Meteor.subscribe('s3files');
        Meteor.subscribe('s3_global_config');
        Meteor.subscribe('s3config');
        Meteor.subscribe('s3_admin_users');
        Meteor.subscribe('s3_users');
      });
    });
  }
});

Template.s3config_users.helpers({
  admin_users: function () {
    return Roles.getUsersInRole(['s3_admin']).fetch();
  },
  users: function () {
    return Roles.getUsersInRole(['s3_user']).fetch();
  }
});