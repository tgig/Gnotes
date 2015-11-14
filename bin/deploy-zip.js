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
  exec('rm -r ./zipped_lambda/*');

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
      exec('cp ' + dirToZip + '/index.js ' + tmpDir + 'index.js');

      //copy all node_modules to temp folder
      //TO DO: only get the node_modules required by this specific lambda
      files = fs.readdirSync(process.cwd() + '/node_modules');
      //fs.readdirSync(process.cwd() + '/node_modules', function(err, files) {

        for (var file in files) {

          if (files[file] != '.bin' && files[file] != 'aws-sdk') {

            var filePath = currentDir + '/node_modules/' + files[file];
            var stat = fs.statSync(filePath);
            //fs.stat(filePath, function(err, stat) {

              if (stat.isDirectory()) {
                console.log('copied folder ' + filePath);
                exec('cp -r ' + filePath + ' ' + tmpDir + '/node_modules');
              }
              else {
                console.log(filePath + ' is not a folder');
              }
            //});

          }

        }


      //});

      callback(null);

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
  exec('cd ' + tmpDir + '; zip -roq ' + currentDir + '/zipped_lambda/' + dirToZip + '.zip .');
  console.log('success');
});



