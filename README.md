# Amazon S3 Uploader
S3 provides a simple way of uploading files to the Amazon S3 service. This is useful for uploading images and files that you want accesible to the public. S3 is built on [Knox](https://github.com/LearnBoost/knox), a module that becomes available server-side after installing this package.

##Improvements

* Added a progress bar as a template.
* Added a collection to track the uploaded files with username and original file name.
* Added the option to have a path for the `{{#S3}}..{{/S3}}` block helper. 

## Installation

```
mrt add s3-progress
```

## How to use

### Step 1 - SERVER SIDE
Define your Amazon S3 credentials.

```
Meteor.call("S3config",{
	key: 'amazonKey',
	secret: 'amazonSecret',
	bucket: 'bucketName',
	directory: '/subfolder/' //This is optional, defaults to root
});
```

### Step 2 - CLIENT SIDE
Create an S3 input with an optional callback and optional path.

The path can be anything meaningful to you:

 - an application identifier
 - user ID
 - group ID
 - etc.

```
{{#S3 callback="callbackFunction" path="unique_path_for_this_project"}}
	<input type="file">
{{/S3}}
```

If you wish to have a progress bar for the uploaded file add `{{> s3progress}}` to the template where you have the `{{#S3}}..{{/S3}}` block helper.


### Step 3 - SERVER SIDE
Create a callback function that will handle what to do with the generated URL. .

```
Meteor.methods({
	callbackFunction:function(url,context){
		console.log('Add '+url+' to the id of '+context);
	}
});
```

## Create your Amazon S3
For all of this to work you need to create an aws account. On their website create navigate to S3 and create a bucket. Navigate to your bucket and on the top right side you'll see your account name. Click it and go to Security Credentials. Once you're in Security Credentials create a new access key under the Access Keys (Access Key ID and Secret Access Key) tab. This is the info you will use for the first step of this plug. Go back to your bucket and select the properties OF THE BUCKET, not a file. Under Static Website Hosting you can Enable website hosting, to do that first upload a blank index.html file and then enable it. YOU'RE NOT DONE.

You need to set permissions so that everyone can see what's in there. Under the Permissions tab click Edit CORS Configuration and paste this:

```
<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
    <CORSRule>
        <AllowedOrigin>*</AllowedOrigin>
        <AllowedMethod>GET</AllowedMethod>
    </CORSRule>
</CORSConfiguration>
```

Save it. Now click Edit bucket policy and paste this, REPLACE THE BUCKET NAME WITH YOUR OWN:

```
{
	"Version": "2008-10-17",
	"Statement": [
		{
			"Sid": "AllowPublicRead",
			"Effect": "Allow",
			"Principal": {
				"AWS": "*"
			},
			"Action": "s3:GetObject",
			"Resource": "arn:aws:s3:::YOURBUCKETNAMEHERE/*"
		}
	]
}
```

Enjoy, this took me a long time to figure out and I'm sharing it so that nobody has to go through all that.

## Credits
Forked from original work done by Lepozepo/S3

## Donating
By donating you are supporting this package and its developer so that he may continue to bring you updates to this and other software he maintains.

[![Support us via Gittip][gittip-badge]][digilord]

[gittip-badge]: https://rawgithub.com/digilord/gittip-badge/master/dist/gittip.png
[digilord]: https://www.gittip.com/digilord/
