var exec = require("child_process").exec;
var fs = require("fs");

/*
  This function deletes anything already in the temp or zipped_lambda folders so
    we can put the new stuff in
*/
function prepDirs(runtimeDir, zipDir, callback) {
  //delete what is currently in temp dir
  exec('rm -r ' + runtimeDir);

  //delete what is currently in zipped_lambda dir
  exec('rm -r ' + zipDir + '*');
  exec('rm -r ' + zipDir + '.??*');

  //make temp directory, copy lambda
  exec('mkdir ' + runtimeDir);
  exec('mkdir ' + runtimeDir + '/node_modules');

  callback();
}

/*
  This function will copy the Lambda file and all dependencies into a temp directory
*/
exports.copyLambda = function(runtimeDir, zipDir, moduleName, callback) {
  var dirToZip = '';

  if (moduleName != undefined) {
    dirToZip = process.cwd() + '/' + moduleName;
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

    prepDirs(runtimeDir, zipDir, function () {

      //Do a series of copying the appropriate files to the temp directory

      exec('cp ' + dirToZip + '/index.js ' + runtimeDir + 'index.js', function(err, stdout, stderr) {
        if (err) {
          throw('error when copying index.js: ' + err);
        }

        console.log('# Copied ' + dirToZip + '/index.js >> to >> ' + runtimeDir + 'index.js');

        //copy .env file to temp folder (it is in the parent dir, so need to do some fancy footwork)
        exec('cd ' + process.cwd() + '; cd ..; cp .env ' + runtimeDir + '.env', function(err, stdout, stderr) {
          if (err) {
              throw('Error when copying .env: ' + err);
            }

          console.log('# Copied .env file to temp dir');

          //copy all node_modules to temp folder
          exec('cd ' + process.cwd() + '; cd ..; cp -r node_modules ' + runtimeDir, function(err, stdout, stderr) {
            if (err) {
              throw('error when copying /node_modules: ' + err);
            }

            console.log('# Copied /node_modules to temp dir');

            //copy shared folder to temp folder
            exec('cp -r shared ' + runtimeDir, function(err, stdout, stderr) {
              if (err) {
                throw('error when copying /shared: ' + err);
              }

              console.log('# Copied /lambda/shared to temp dir');

              //now delete the aws-sdk & punch folders
              exec('rm -r ' + runtimeDir + '/node_modules/aws-sdk', function() {
                exec('rm -r ' + runtimeDir + '/node_modules/punch', function() {
                  callback(null);
                });
              });

            });

          });

        });

      });


    });


  });

}
