# ![S3](https://raw.github.com/digilord/Meteor-S3-Progress/master/aws-icon.jpg) S3 Progress
This package provides a simple way of uploading files to the Amazon S3 service. This is useful for uploading images and files that you want accesible to the public. The package is built on [Knox](https://github.com/LearnBoost/knox), a module that becomes available server-side after installation.

##Features

* Progress bar
* Per user S3 configuration.
* Application wide S3 configuration.
* Configure via code or configuration view.
* Roles for `s3_admin` and `s3_user` are provided via the Roles package.

## Installation

```
mrt add S3-Progress
```

## Requirements
This package makes use of the following packages:

 - roles
 - accounts-base
 - accounts-password
 - momentjs
 - bootboxjs
 - collection-hooks
 
All the styling is done via [Bootstrap](http://getbootstrap.com/), but I didn't make the bootstrap package a dependency.  That way you, the pacakge user, can style it as you see fit.

### Server Setup
In order to use the S3 service you need to provide some information.  This information is stored in a collection on your server.  Defining it in a file on the server side of your application simply inserts the needed data into the collection that is used to store the credentials for the users and the overall configuration for the application.

As an `s3_admin` you will be allowed to change these settings via a view on the client side of things.  I recommend that you protect this view so that general users cannot see it.



Define your Amazon S3 credentials.

```
Meteor.call("S3config",{
	key: 'amazonKey',
	secret: 'amazonSecret',
	bucket: 'bucketName',
	directory: '/',				// Set this to a directory in this bucket.
	allow_user_config: 'on', 	// Valid values 'on' and 'off'
	use_user_role: 'off'		// Valid values 'on' and 'off'
});
```
Optionally you may skip this step.  If you do the package will prompt you for the configuration.

### Templates
 * Add `{{> s3upload}}` to the template where you would like the upload HTML to reside.
 * Add `{{> s3list_all}}` for a listing off all the files in S3 for this application.
 * Add `{{> s3list_of_user}}` for a listing of the logged in users files in S3.
 * Add `{{> s3config}}` to access the configuration options for the package.
 * Add `{{> s3config_admin_users}}` to administer the users for the package.
 * Add `{{> s3config_user}}` to your user profile edit view to allow users to add in
 their own S3 configuration.


## Amazon S3 Setup
For all of this to work you need to create an aws account. On their website create navigate to S3 and create a bucket. Navigate to your bucket and on the top right side you'll see your account name. Click it and go to Security Credentials. Once you're in Security Credentials create a new access key under the Access Keys (Access Key ID and Secret Access Key) tab. This is the info you will use for the first step of this plug. Go back to your bucket and select the properties OF THE BUCKET, not a file. Under Static Website Hosting you can Enable website hosting, to do that first upload a blank index.html file and then enable it. YOU'RE NOT DONE.

### CORS Setup
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

### Bucket Policy
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

### Users
I recommend setting up an AWS Identity and Access Management (IAM) user per application.  Please refer to the AWS documentation on how to add a user.

## Credits
Forked from original work done by [Lepozepo/S3](https://github.com/Lepozepo/S3).

## To Do
- Complete ability to have folders.
- Allow end users to set a session variable to nest items within a bucket.
- Drag-n-drop file upload.
- Add ability to save files to the servers filesystem. This would change the package from being specifically S3 to a more general file upload solution. See issue #1.

## License
The MIT License (MIT)

Copyright (c) 2013 D. Allen Morrigan

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Donating
By donating you are supporting this package and its developer so that he may continue to bring you updates to this and other software he maintains.

[![Support us via Gittip][gittip-badge]][digilord]

[gittip-badge]: https://rawgithub.com/digilord/gittip-badge/master/dist/gittip.png
[digilord]: https://www.gittip.com/digilord/
