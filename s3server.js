Knox = Npm.require("knox");
var Future = Npm.require('fibers/future');
var streamBuffers = Npm.require("stream-buffers");

var knox;
var S3;


Meteor.publish('s3files', function(){
  return S3files.find({user: this.userId})
});

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
    var file_stream_buffer = new streamBuffers.ReadableStreamBuffer({
      frequency: 10,       // in milliseconds.
      chunkSize: 2048     // in bytes.
    });

    console.log('Calling S3upload');
    var future = new Future();

    S3files.upsert({file_name: file.name},{
      user: Meteor.userId(),
      file_name: file.name,
      original_name: file.originalName
    })
    if(path != null) {
      path = path+"/"+file.name;
    } else {
      path = S3.directory+file.name;
    }

    var buffer = new Buffer(file.data);
    file_stream_buffer.put(buffer);
    var headers = {
      "Content-Type":   file.type,
      "Content-Length": buffer.length
    }

    var put = knox.putStream(file_stream_buffer,path,headers,function(e,r){
      if(r){
        future.return(path);
      } else {
        console.log('There was an error...');
      }
    });

    put.on('progress', Meteor.bindEnvironment(function(progress){
        S3files.update({file_name: file.name}, {$set: {percent_uploaded: progress.percent}});
      },function(err){
        console.log(err);
      })
    );

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
    console.log(files);
  }

});
