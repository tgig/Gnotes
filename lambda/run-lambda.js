/*
  This script will accept a directory name and locally execute a Lambda inside of it
*/
var fs = require('fs');


//context.done() called when execution is complete
var context = {
  done: function (err, result) {
    console.log('\n--------------------------');
    console.log('Context done');
    console.log('   error:', err);
    console.log('   result:', result);
  },
  succeed: function(data) {
    console.log(data);
  }
};


function lambdaJSFile(lambdaDir, callback) {
  fs.exists(lambdaDir + 'index.js', function(exists) {
    if (exists) {
      return callback(null, lambdaDir + 'index.js');
    }
    else
      return callback(new Error("index.js file does not exist in: " + lambdaDir));
  });
}

function lambdaEventJson(lambdaDir, callback) {
  //get the event.json text into var
  fs.readFile(lambdaDir + 'event.json', function(err, data) {
    if (err) {
      return callback(new Error("event.json file does not exist in " + lambdaDir));
    }

    return callback(null, data);
  });
}

function runLambda(folder) {
  var lambdaDir = process.cwd() + '/' + folder + '/';

  lambdaJSFile(lambdaDir, function(err, lambdaFile) {
    if (err) {
      console.log('Error in lambdaJSFile: ' + err);
      return;
    }

    lambdaEventJson(lambdaDir, function(err, eventJson) {
      if (err) {
        console.log('Error in lambdaEventJson: ' + err);
        return;
      }

      //output results of test
      console.log("\n--------------------------");
      console.log("Executing file: " + lambdaFile);
      console.log("Event.json: " + eventJson);
      console.log("--------------------------\n");
      var exec = require(lambdaFile);
      exec.handler(JSON.parse(eventJson), context);

    });

  });
}

runLambda(process.argv[2]);

