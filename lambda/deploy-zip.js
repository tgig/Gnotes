/*

  deploy-zip.js

  This script packages up a Lambda, zips it, and puts into the /bin/zipped_lambda folder
  It can then be uploaded to AWS manually

  Pass in the folder name of the AWS Lambda function
  node bin/deploy-zip test-folder

*/

var exec = require("child_process").exec;
var os = require("os");
var fs = require("fs");

var moduleName = process.argv[2];
var currentDir = process.cwd();
var tmpDir = os.tmpDir() + '/tempAwsLambda/';
var zippedLambdaDir = currentDir + '/zipped_lambda/';

/*
  This function deletes anything already in the temp or zipped_lambda folders so
    we can put the new stuff in
*/
function prepDirs(callback) {
  //delete what is currently in temp dir
  exec('rm -r ' + tmpDir);

  //delete what is currently in zipped_lambda dir
  exec('rm -r ' + zippedLambdaDir + '*');
  exec('rm -r ' + zippedLambdaDir + '.??*');

  //make temp directory, copy lambda
  exec('mkdir ' + tmpDir);
  exec('mkdir ' + tmpDir + '/node_modules');

  callback();
}

/*
  This function will copy the Lambda file and all dependencies into a temp directory
*/
function copyLambda(moduleName, callback) {
  var dirToZip = '';

  if (moduleName != undefined) {
    dirToZip = currentDir + '/' + moduleName + '/' + dirToZip;
  }
  else {
    callback('You need to pass in a lambda name as an argument');
  }

  //if the passed in directory does not exist, then throw an error
  fs.exists(dirToZip, function(exists) {
    if (!exists) {
      console.log('# huh? ' + exists);
      callback('The directory you passed in does not exist. Casing matters.');
    }

    prepDirs(function () {

      //Do a series of copying the appropriate files to the temp directory

      exec('cp ' + dirToZip + 'index.js ' + tmpDir + 'index.js', function(err, stdout, stderr) {
        if (err) {
          throw('error when copying index.js: ' + err);
        }

        console.log('# Copied ' + dirToZip + 'index.js >> to >> ' + tmpDir + 'index.js');

        //copy .env file to temp folder (it is in the parent dir, so need to do some fancy footwork)
        exec('cd ' + currentDir + '; cd ..; cp .env ' + tmpDir + '.env', function(err, stdout, stderr) {
          if (err) {
              throw('Error when copying .env: ' + err);
            }

          console.log('# Copied .env file to temp dir');

          //copy all node_modules to temp folder
          exec('cd ' + currentDir + '; cd ..; cp -r node_modules ' + tmpDir, function(err, stdout, stderr) {
            if (err) {
              throw('error when copying /node_modules: ' + err);
            }

            console.log('# Copied /node_modules to temp dir');

            //now delete the aws-sdk & punch folders
            exec('rm -r ' + tmpDir + '/node_modules/aws-sdk', function() {
              exec('rm -r ' + tmpDir + '/node_modules/punch', function() {
                callback(null);
              });
            });



          });

        });

      });


    });


  });

}

function zipFiles(callback) {
  console.log('# zipFiles: cd ' + tmpDir + '; zip -roq ' + zippedLambdaDir + moduleName + '.zip .');
  //throw('done');

  exec('cd ' + tmpDir + '; zip -roq ' + zippedLambdaDir + moduleName + '.zip .', function(err, stdout, stderr) {
    if (err) {
      throw('Error when zipping files to zipped_lambda dir: ' + err);
    }

    console.log('# Created zip in zipped_lambda');

    callback();
  });

}


copyLambda(moduleName, function(err) {
  if (err) {
    throw('**********\nError: ' + err + '\n**********');
  }

  //zip contents of temp directory (first need to navigate to temp dir)
  //  into ./zipped_lambda dir
  zipFiles( function(err, data) {

    console.log('# Deploying to AWS Lambda...');

    //now upload the zip file to AWS and publish
    //aws lambda update-function-code --function-name "DB-retrieve-token" --zip-file fileb://bin/zipped_lambda/module-db-get-auth-token.zip --publish
    exec('aws lambda update-function-code --function-name "' + moduleName + '" --zip-file fileb://zipped_lambda/' + moduleName + '.zip --publish', function(err, stdout, stderr) {
      if (err) {
        throw('Error when transferring zip file to AWS: ' + err);
      }

      console.log('# tmpDir: ' + tmpDir);
      console.log('# Done');
    });



  });





});



