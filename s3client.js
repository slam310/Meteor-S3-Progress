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
          options = {};
          options.file = fileData;
          options.context = context;
          options.callback = callback;
          if(path != null){
            options.path = path;
          }
          Meteor.call("S3upload", options)

        };

        reader.readAsArrayBuffer(file);

      });
    }
  },html);

  return html;
});