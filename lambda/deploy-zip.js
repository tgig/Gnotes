/*

  deploy-zip.js

  This script packages up a Lambda, zips it, and puts into the /bin/zipped_lambda folder
  It can then be uploaded to AWS manually

  Pass in the folder name of the AWS Lambda function
  node bin/deploy-zip test-folder

*/

var runtime = require('./shared/runtime.js')
var exec = require("child_process").exec;
var os = require("os");
var fs = require("fs");

var moduleName = process.argv[2];
var currentDir = process.cwd();
var runtimeDir = currentDir + '/runtime/';
var zipDir = currentDir + '/zipped_lambda/';

function zipFiles(callback) {
  console.log('# zipFiles: cd ' + runtimeDir + '; zip -roq ' + zipDir + moduleName + '.zip .');
  //throw('done');

  //if zipDir does not exist, create it
  try {
    exec('cd ' + runtimeDir + '; mkdir ' + zipDir);
  }
  catch(err) { /*nothing*/ }

  exec('cd ' + runtimeDir + '; zip -roq ' + zipDir + moduleName + '.zip .', function(err, stdout, stderr) {
    if (err) {
      throw('Error when zipping files to zipped_lambda dir: ' + err);
    }

    console.log('# Created zip in zipped_lambda');

    callback();
  });

}


runtime.copyLambda(runtimeDir, zipDir, moduleName, function(err) {
  if (err) {
    throw('**********\nError: ' + err + '\n**********');
  }

  //zip contents of temp directory (first need to navigate to temp dir)
  //  into ./zipped_lambda dir
  zipFiles( function(err, data) {

    console.log('# Deploying to AWS Lambda...');

    //now upload the zip file to AWS and publish
    //aws lambda update-function-code --function-name "DB-retrieve-token" --zip-file fileb://bin/zipped_lambda/module-db-get-auth-token.zip --publish
    exec('aws lambda update-function-code --function-name "' + moduleName + '" --zip-file fileb://zipped_lambda/' + moduleName + '.zip --publish --region us-east-1', function(err, stdout, stderr) {
      if (err) {
        throw('Error when transferring zip file to AWS: ' + err);
      }

      console.log('# runtimeDir: ' + runtimeDir);
      console.log('# Done');
    });



  });





});



