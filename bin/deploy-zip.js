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

var dirToZip = process.argv[2];
var currentDir = process.cwd();
var tmpDir = os.tmpDir() + '/tempAwsLambda/';

/*
  This function deletes anything already in the temp or zipped_lambda folders so
    we can put the new stuff in
*/
function prepDirs(callback) {
  //delete what is currently in temp dir
  exec('rm -r ' + tmpDir);

  //delete what is currently in zipped_lambda dir
  exec('rm -r ./bin/zipped_lambda/*');

  //make temp directory, copy lambda
  exec('mkdir ' + tmpDir);
  exec('mkdir ' + tmpDir + '/node_modules');

  callback();
}

/*
  This function will copy the Lambda file and all dependencies into a temp directory
*/
function copyLambda(dirToZip, callback) {
  if (dirToZip == undefined) {
    callback('You need to pass in a directory name');
  }


  dirToZip = currentDir + '/' + dirToZip;

  //if the passed in directory does not exist, then throw an error
  fs.exists(dirToZip, function(exists) {
    if (!exists) {
      console.log('huh? ' + exists);
      callback('This directory does not exist in the current directory');
    }

    prepDirs(function () {
      exec('cp ' + dirToZip + '/index.js ' + tmpDir + 'index.js', function(err, stdout, stderr) {
        if (err) {
          console.log('error when copying index.js: ' + err);
        }

        console.log('Copied ' + dirToZip + '/index.js >> to >> ' + tmpDir + 'index.js');

        //copy all node_modules to temp folder
        exec('cp -r ' + currentDir + '/node_modules ' + tmpDir, function(err, stdout, stderr) {
          if (err) {
            console.log('error when copying /node_modules: ' + err);
          }

          //now delete the aws-sdk folder
          exec('rm -r ' + tmpDir + '/node_modules/aws-sdk')

          callback(null);
        });
      });


    });


  });

}



copyLambda(dirToZip, function(err) {
  if (err) {
    throw('**********\nError: ' + err + '\n**********');
  }

  console.log('tmpDir: ' + tmpDir);

  //zip contents of temp directory (first need to navigate to temp dir)
  //  into this dir ./zipped_lambda dir
  exec('cd ' + tmpDir + '; zip -roq ' + currentDir + '/bin/zipped_lambda/' + dirToZip + '.zip .');
  console.log('success');
});



