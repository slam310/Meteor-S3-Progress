Handlebars.registerHelper('S3', function (options) {
  var uploadOptions = options.hash;
  var template = options.fn;
  var callback = uploadOptions.callback;
  var path = uploadOptions.path;
  var context = this;

  if (!template) return;

  var html;
  html = Spark.isolate(function(){
    return template();
  });

  html = Spark.attachEvents({
    'change input[type=file]': function (event,template) {
      var files = event.currentTarget.files;
      _.each(files,function(file){
        var reader = new FileReader;
        var fileData = {
          name:file.name,
          size:file.size,
          type:file.type
        };

        reader.onload = function (e) {
          if(e){
            console.log(e)
          }
          fileData.data = new Uint8Array(reader.result);
          fileData.originalName = fileData.name;
          var extension = (fileData.name).match(/\.[0-9a-z]{1,5}$/i);
          fileData.name = Meteor.uuid()+extension;
          options = {};
          options.file = fileData;
          options.context = context;
          options.callback = callback;
          if(path != null){
            options.path = path;
          }
          Session.set('s3-file-name', fileData.name)
          Meteor.call("S3upload", options)
        };

        reader.readAsArrayBuffer(file);

      });
    },
    'click .s3-file-upload-button': function(e) {
      $('.s3-file-upload').click();
    }
  },html);

  return html;
});

Meteor.subscribe('s3files');

Template.s3progress.helpers({
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
    if(this.percent_uploaded != 100) {
      return 's3-upload-progressing';
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