var https = require('https');
const oauthAccessToken = 'G1liPXY-TsEAAAAAAAACAsYwiycOt1SddOk6FevlJccu1tDe1o0132unUbh3AqZ6';


// For development/testing purposes
exports.handler = function( event, context ) {
  console.log( "Preparing to run parseNote()" );
  console.log( "==================================");

  getChangedFiles(oauthAccessToken, function(err, data) {
    if (err) {
      console.log('Error: ' + err);
    }

    console.log('data: ' + data);
  })

  console.log( "==================================");
  console.log( "Stopping index.handler" );
  context.done( );
}

function getChangedFiles(authToken, callback) {

  _path = '/2/files/get_metadata';
  //_cursor = '{\"cursor\": \"' + cursor + '\"}';
  _postData = '{\"path\": \"/Test 2 (mod).txt\", \"include_media_info\": false}'
  _authToken = authToken;

  _getChangedFiles(_path, _postData, _authToken, function(err, data) {
    if (err) {
      callback(new Error('Error in _getChangedFiles: ' + err));
      return;
    }

    callback(null, data);
  });

}

function _getChangedFiles(path, postData, authToken, callback) {

  var _return = '';

  //set options to call dropbox api
  var options = {
    hostname: 'api.dropboxapi.com',
    path: path,
    port: 443,
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + authToken,
      'Content-Type': 'application/json'
    }
  }

  var req = https.request(options, function(res) {
    res.setEncoding('utf8');

    res.on('data', function(chunk) {
      callback(null, chunk);
    });

    res.on('error', function(err) {
      callback(new Error(err));
    });

  });

  //write data to request body
  req.write(postData);
  req.end();

}
