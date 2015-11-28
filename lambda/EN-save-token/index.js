/*
this will accept three pre-generated Evernote tokens:
  * oauthToken
  * oauthSecret
  * oauthVerifier

then it will,
...use the Evernote client library to generate an actual access token (i hate you evernote)
...save the token to the database
...create a sample text file in the dropbox folder
...return to client

*/


var AWS = require("aws-sdk");
var Evernote = require('evernote').Evernote;
require("dotenv").load();

exports.handler = function(event, context) {
  if (!event.dropboxUserId || !event.oauthToken || !event.oauthSecret || !event.oauthVerifier) {
    throw(new Error("function expects appropriate data to be passed in"));
  }

  main(event.dropboxUserId, event.oauthToken, event.oauthSecret, event.oauthVerifier, function (err, data) {
    context.succeed({"success": "success"});
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


/*
End - API calls
------------
*/

/*
--------------
Database calls
*/
function saveEvernoteAccessToken(dropboxUserId, oauthAccessToken, callback) {
  var params = {
    TableName: "DropboxEvernoteUser",
    Key: {
      "DropboxUserId": {
        "N": dropboxUserId.toString()
      }
    },
    UpdateExpression: "SET EvernoteAuthToken = :oauthAccessToken",
    ExpressionAttributeValues: {
      ":oauthAccessToken": {
       "S": oauthAccessToken
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

function main(dropboxUserId, oauthToken, oauthSecret, oauthVerifier, callback) {

  var user = new User();

  var client = new Evernote.Client ({
    consumerKey: process.env.evernote_consumer_key,
    consumerSecret: process.env.evernote_consumer_secret,
    sandbox: true
  });

  client.getAccessToken(oauthToken, oauthSecret, oauthVerifier, function(err, oauthAccessToken, oauthAccessTokenSecret, results) {
      if(err) {
        throw('Error in client.getAccessToken: ' + err);
      }

      saveEvernoteAccessToken(dropboxUserId, oauthAccessToken, function(err, data) {
        callback(null, "success");
      });

    }
  );
}
