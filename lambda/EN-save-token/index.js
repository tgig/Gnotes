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


var request = require("request");
var AWS = require("aws-sdk");
var Evernote = require('evernote').Evernote;
require("dotenv").load();
var ErrorHandler = require('./shared/error-handler');

exports.handler = function(event, context) {
  if (!event.dropboxUserId || !event.oauthToken || !event.oauthSecret || !event.oauthVerifier) {
    console.log('event: ' + JSON.stringify(event, null, 2));
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
      callback(err);
    else
      callback(null, data);
  });
}
/*
End - Database calls
--------------
*/

function createDropboxFile(authToken, callback) {
  var postUrl = 'https://content.dropboxapi.com/2/files/upload';
  var dropboxApiArg = {
      path: '/Hello-World.md',
      mode: 'add',
      autorename: true,
      mute: false
    };
  var postData = {
    headers: {
      "Authorization": "Bearer " + authToken,
      "Dropbox-API-Arg": JSON.stringify(dropboxApiArg),
      "Content-Type": "text/plain; charset=dropbox-cors-hack"
    },
    body: "Hello World!\n\n# Welcome to Gnotes.\n\nThis is your first markdown file. It will be synced to your linked Evernote account.\n\n**Now you can write like the wind!** Here is what you need to know:\n  * The first line will be your Evernote title\n  * You can use markdown and it will format your resulting Evernote file\n  * Syncing errors occasionally happen (especially when markdown is not successfully encoded in Evernote appropriate syntax) and you'll get an email notification. If you get an email error, that means your file *did not sync* to Evernote\n  * Got questions? Send me an email: travis@giggy.com"
  };

  request.post(postUrl, postData, function (error, response, body) {

    if (error) {
      ErrorHandler.LogError('Error in createDropboxFile request.post: ' + error);
    }
    else if (response.statusCode == 400) {
      throw(new Error('400 error in createDropboxFile request.post: ' + response.body));
    }

    var data = JSON.parse(body);

    callback(null, "success");


  });

}

function main(dropboxUserId, oauthToken, oauthSecret, oauthVerifier, callback) {

  var client = new Evernote.Client ({
    consumerKey: process.env.evernote_consumer_key,
    consumerSecret: process.env.evernote_consumer_secret,
    sandbox: false
  });

  client.getAccessToken(oauthToken, oauthSecret, oauthVerifier, function(err, oauthAccessToken, oauthAccessTokenSecret, results) {
      if(err) {
        throw(new Error('Error in client.getAccessToken: ' + JSON.stringify(err, null, 2)));
      }

      console.log('Successfully retrieved evernote access token');

      saveEvernoteAccessToken(dropboxUserId, oauthAccessToken, function(err, data) {
        if (err) {
          ErrorHandler.LogError('saveEvernoteAccessToken: ' + err);
        }

        console.log('saveEvernoteAccessToken data: ' + JSON.stringify(data));

        //NEED TO: save a file to Dropbox to get us started
        createDropboxFile(data.Attributes.DropboxAuthToken.S, function(err, data) {
          if (err) {
            ErrorHandler.LogError('createDropboxFile(): ' + err);
          }

          console.log('Successfully created the new file in dropbox');

          callback(null, "success");
        });

      });

    }
  );
}
