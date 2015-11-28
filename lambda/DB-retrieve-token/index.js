/*
this will accept a code,
request a token,
save a new user (or update an existing user)
get appropriate link for Evernote auth
*/

var request = require("request");
var AWS = require("aws-sdk");
var Evernote = require('evernote').Evernote;
require("dotenv").load();


exports.handler = function(event, context) {
  main(event.code, function (err, returnData) {
    context.succeed(returnData);
  });
}

/*
----------
Vars and Objects
*/
var callbackUrl = 'http://localhost:9009';
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
      redirect_uri: callbackUrl
    },
    auth: {
      user: process.env.aws_client_id,
      pass: process.env.aws_client_secret
    }
  };

  // exchange access code for bearer token
  request.post(postUrl, postData, function (error, response, body) {

    if (error) {
      throw('Error getting dropbox bearer token: ' + error);
    }
    else if (response.statusCode == 400) {
      throw('Error getting dropbox bearer token. Response body: ' + response.body);
    }

    var data = JSON.parse(body);

    // extract bearer token
    var dropboxToken = data.access_token;
    var dropboxUserId = data.uid;

    console.log('dropboxToken: ' + dropboxToken);
    console.log('dropboxUserId: ' + dropboxUserId);

    //update/insert into database
    saveDropboxToken(dropboxUserId, dropboxToken, function(err, data) {
      if (err) {
        throw('Error when saving dropbox token: ' + err);
      }

      callback(null, dropboxUserId);

    });

  });

}

function getEvernoteOAuthLink(callback) {
  var client = new Evernote.Client ({
    consumerKey: process.env.evernote_consumer_key,
    consumerSecret: process.env.evernote_consumer_secret,
    sandbox: true
  });

  client.getRequestToken(callbackUrl, function(err, oauthToken, oauthSecret, results){
    if(err) {
      throw('Error in getEvernoteOAuthLink: ' + err);
    }
    else {
      enData = {
        oauthToken: oauthToken,
        oauthSecret: oauthSecret,
        authorizeUrl: client.getAuthorizeUrl(oauthToken)
      }
      callback(null, enData);
    }
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

  getDropboxToken(code, function(err, dropboxUserId) {

    getEvernoteOAuthLink(function(err, evernoteData) {
      if (err) {
        throw('Error in getEvernoteOAuthLink callback: ' + err);
      }

      returnData = {
        "dropboxUserId": dropboxUserId,
        "evernoteOAuthToken": evernoteData.oauthToken,
        "evernoteOAuthSecret": evernoteData.oauthSecret,
        "evernoteAuthorizeUrl": evernoteData.authorizeUrl
      }
      callback(null, dropboxTokenData, returnData);
    });

  });
}
