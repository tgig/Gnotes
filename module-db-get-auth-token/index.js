/*
this will accept a code,
request a token,
save a new user (or update an existing user)
*/

var request = require("request");
var AWS = require("aws-sdk");
require("dotenv").load();


exports.handler = function(event, context) {
  main(event.code, function (err, data) {
    context.succeed({"success": data});
  });
}

/*
----------
Vars and Objects
*/
var dynamodb = new AWS.DynamoDB();

function User(dropboxUserId, dropboxFileCursor, dropboxAuthToken, evernoteAuthToken) {
    this.dropboxUserId = dropboxUserId;
    this.dropboxFileCursor = dropboxFileCursor;
    this.dropboxAuthToken = dropboxAuthToken;
    this.evernoteAuthToken = evernoteAuthToken;
}
/*
End - Vars and Objects
----------
*/


/*
------------
API calls
*/
function getDropboxToken(code, callback) {
  var postUrl = 'https://api.dropbox.com/1/oauth2/token';
  var postData = {
    form: {
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: 'http://localhost:9009'
    },
    auth: {
      user: process.env.aws_client_id,
      pass: process.env.aws_client_secret
    }
  };

  // exchange access code for bearer token
  request.post(postUrl, postData, function (error, response, body) {
    var data = JSON.parse(body);

    if (data.error) {
      console.log('Error getting dropbox bearer token: ' + data.error);
    }

    // extract bearer token
    var dropboxToken = data.access_token;
    var dropboxUserId = data.uid;

    console.log('dropboxToken: ' + dropboxToken);
    console.log('dropboxUserId: ' + dropboxUserId);

    //update/insert into database
    saveDropboxToken(dropboxUserId, dropboxToken, function(err, data) {

      callback(null, data);

    });

  });

}

/*
End - API calls
------------
*/

/*
--------------
Database calls
*/
function saveDropboxToken(dropboxUserId, dropboxToken, callback) {
  var params = {
    TableName: "DropboxEvernoteUser",
    Key: {
      "DropboxUserId": {
        "N": dropboxUserId.toString()
      }
    },
    UpdateExpression: "SET DropboxAuthToken = :dropboxToken",
    ExpressionAttributeValues: {
      ":dropboxToken": {
       "S": dropboxToken
      }
    },
    ReturnValues: "ALL_NEW"
  };


  dynamodb.updateItem(params, function(err, data) {
    if (err)
      callback(new Error(err));
    else
      callback(null, data);
  });
}
/*
End - Database calls
--------------
*/

function main(code, callback) {
  //call dropbox with code
  //get back a token and uid
  //does uid exist in db?
    //yes - update
    //no - insert
  //return success

  var user = new User();

  getDropboxToken(code, function(err, dropboxTokenData) {
    callback(null, "success");
  });
}
