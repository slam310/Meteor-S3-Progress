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
    'change input[type=file]': function (e) {
      var files = e.currentTarget.files;
      _.each(files,function(file){
        var reader = new FileReader;
        var fileData = {
          name:file.name,
          size:file.size,
          type:file.type
        };

        reader.onload = function () {
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
    }
  },html);

  return html;
});

Meteor.subscribe('s3files');

Template.s3progress.helpers({
  progress: function () {
    var file_name = Session.get('s3-file-name')
    if(file_name != null){
      var file = S3files.findOne({file_name: file_name});
      if(file){
        var percent = file.percent_uploaded
        if(percent)
          return percent
      }
    }
    return 0;
  }
});