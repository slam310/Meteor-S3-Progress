Knox = Npm.require("knox");
var Future = Npm.require('fibers/future');

var knox;
var S3;

Meteor.methods({
  S3config:function(obj){
    knox = Knox.createClient(obj);
    S3 = {directory:obj.directory || "/"};
  },
  S3upload:function(options){
    var file = options.file;
    var context = options.context;
    var callback = options.callback;
    var path = options.path;

    console.log('Calling S3upload');
    var future = new Future();

    var extension = (file.name).match(/\.[0-9a-z]{1,5}$/i);
    file.name = Meteor.uuid()+extension;
    if(path != null) {
      path = path+"/"+file.name;
    } else {
      path = S3.directory+file.name;
    }

    var buffer = new Buffer(file.data);

    knox.putBuffer(buffer,path,{"Content-Type":file.type,"Content-Length":buffer.length},function(e,r){
      if(r){
        future.return(path);
      } else {
        console.log(e);
      }
    });

    var url = knox.http(future.wait());
    if(url != null && typeof callback == 'string'){
      console.log("URL: ", url);
      Meteor.call(callback,url,context);
    }
  },
  S3delete:function(path, callback){
    knox.deleteFile(path, function(e,r) {
      if(e){
        console.log(e);
      } else if(callback){
        Meteor.call(callback);
      }
    });
  }
});
