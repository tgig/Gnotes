require("dotenv").load({path: './.env'});
var request = require("request");
var AWS = require("aws-sdk");
var marked = require("marked");
var Evernote = require('evernote').Evernote;
var yaml = require('yaml-front-matter');
var moment = require('moment');
var path = require('path');
var ErrorHandler = require('./shared/error-handler');

AWS.config.update({
  region: "us-east-1",
});

marked.setOptions({
  gfm: true,
  breaks: true,
  xhtml: true
});

var dynamodb = new AWS.DynamoDB();

exports.handler = function(event, context) {

  console.log('Calling main(), event: ' + JSON.stringify(event));

  main(event.Records[0].Sns.Message, function(err, data) {
    if (err) {
      return ErrorHandler.LogError(err);
    }

    context.succeed(data);

    context.done( );

  });

}

/*
----------
Vars and Objects
*/

function User(dropboxUserId, dropboxFileCursor, dropboxAuthToken, evernoteAuthToken, email) {
    this.dropboxUserId = dropboxUserId;
    this.dropboxFileCursor = dropboxFileCursor;
    this.dropboxAuthToken = dropboxAuthToken;
    this.evernoteAuthToken = evernoteAuthToken;
    this.email = email;
}

function Note(title, guid, tags, body) {
  this.title = title;
  this.guid = guid;
  this.tags = tags;
  this.body = body;
}

/*
End - Vars and Objects
----------
*/


/*
--------------
API operations
*/

//call DropBox with the authToken and cursor and retrive list of recently modified files
function getChangedFiles(user, callback) {

  var postData = {
    uri: "https://api.dropboxapi.com/2/files/list_folder/continue",
    headers: {
      "Authorization": "Bearer " + user.dropboxAuthToken,
      "Content-Type": "application/json"
    },
    json: {
      "cursor": user.dropboxFileCursor
    }
  };

  request.post(postData, function (error, response, body) {

    if (error) {
      return ErrorHandler.LogError('Error in getChangedFiles: ' + error, user.email);
    }
    else if (response.statusCode == 400) {
      return ErrorHandler.LogError('Error in getChangedFiles. Response body: ' + response.body, user.email);
    }

    callback(null, body);
  });

}

function downloadFile(fileName, user, callback) {

  console.log('downloadFile user.dropboxAuthToken: ' + user.dropboxAuthToken);

  var postData = {
    uri: "https://content.dropboxapi.com/2/files/download",
    headers: {
      "Authorization": "Bearer " + user.dropboxAuthToken,
      "Dropbox-API-Arg": '{"path": "' + fileName + '"}'
    }
  }

  request.post(postData, function (error, response, body) {

    if (error) {
      return ErrorHandler.LogError('Error in downloadFile: ' + error, user.email);
    }
    else if (response.statusCode == 400) {
      return ErrorHandler.LogError('Error in downloadFile. Response body: ' + response.body, user.email);
    }

    callback(null, body);
  });

}


/*
End - API operations
--------------
*/

/*
--------------
Database operations
*/
function getUser(dropboxUserId, callback) {

  console.log('In getUser(), dropboxUserId: ' + dropboxUserId);

  var params = {
    TableName : "DropboxEvernoteUser",
    Key: {
      "DropboxUserId": {
        "N": dropboxUserId.toString()
      }
    }
  };

  dynamodb.getItem(params, function(err, data) {
    if (err) {
      return ErrorHandler.LogError('Error in DB-retrieve-files.getUser: ' + err);
    }
    else {
      callback(null, data);
    }
  });

}

function getDropboxEvernoteFile(dropboxFileId, user, callback) {

  var params = {
    TableName: "DropboxEvernoteFile",
    Key: {
      "DropboxFileId": {
        "S": dropboxFileId
      }
    }
  };

  dynamodb.getItem(params, function(err, data) {
    if (err) {
      return ErrorHandler.LogError('Error in DB-retrieve-files.getDropboxEvernotefile: ' + err, user.email);
    }
    else {
      callback(null, data);
    }
  });

}


function insertDropboxEvernoteFile(dropboxFileId, evernoteGuid, user, callback) {

  var params = {
    TableName: "DropboxEvernoteFile",
    Item: {
      "DropboxFileId": {"S": dropboxFileId},
      "EvernoteGuid": {"S": evernoteGuid}
    }
  }

  dynamodb.putItem(params, function(err, data) {
    if (err)
      return ErrorHandler.LogError('Error in DB-retrieve-files.insertDropboxEvernotefile: ' + err, user.email);
    else
      callback(null, data);
  });

}

function deleteDropboxEvernoteFile(dropboxFileId, user, callback) {
  var params = {
    TableName: "DropboxEvernoteFile",
    Key: {
      "DropboxFileId": {
        "S": dropboxFileId
      }
    }
  };

  dynamodb.deleteItem(params, function(err, data) {
    if (err)
      return ErrorHandler.LogError('Error in DB-retrieve-files.deleteDropboxEvernoteFile: ' + err, user.email);
    else
      callback(null, data);
  });
}

function updateCursor(user, dropboxFileCursor, callback) {

  var params = {
    TableName: "DropboxEvernoteUser",
    Key: {
      "DropboxUserId": {
        "N": user.dropboxUserId.toString()
      }
    },
    UpdateExpression: "SET DropboxFileCursor = :cursor",
    ExpressionAttributeValues: {
      ":cursor": {
       "S": dropboxFileCursor
      }
    },
    ReturnValues: "UPDATED_NEW"
  };


  dynamodb.updateItem(params, function(err, data) {
    if (err)
      return ErrorHandler.LogError('Error in DB-retrieve-files.updateCursor: ' + err, user.email);
    else
      callback(null, data);
  });
}
/*
End - Database operations
--------------
*/

/*
  In case a title was not specified in the YAML,
  Get the first 255 chars of the first line of content
*/
function getTitle(content) {
  var title = 'nada';
  var _length = 255;

  if (content === '') {
    title = 'New Note Created at ' + moment().format('MMMM Do YYYY, h:mm:ss a');
  }
  else {
    content = content.slice(0, _length);

    if (content.indexOf('\n') < _length)
      content = content.slice(0, content.indexOf('\n'));

    title = content;
  }

  return title;
}

/*
  Get note title, guid, tags, body, if it exists
*/
function parseNote(content) {

  var note = new Note();
  var doc = yaml.loadFront(content);

  if (doc.title != undefined)
    note.title = doc.title;
  else { //auto generate note title and write new title into YAML metadata
    note.title = getTitle(doc.__content);
  }

  //remove line breaks
  try {
    note.title = note.title.trim().replace(/(\r\n|\n|\r)/gm,"");
  }
  catch (e) {
    return ErrorHandler.LogError('error when replacing note.title line breaks: ' + e);
  }

  if (doc.tags != undefined)
    note.tags = doc.tags;

  note.body = doc.__content.trim();

  return note;

}

function sendToEvernote(data, dropboxFileId, user, callback) {

  console.log('entering sendToEvernote');

  var nBodyHead = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
                  "<!DOCTYPE en-note SYSTEM \"http://xml.evernote.com/pub/enml2.dtd\">" +
                  "<en-note>";
  var nBodyFoot = "</en-note>";

  //parse YAML out of head
  var note = parseNote(data);

  //convert markdown to HTML
  if (note.body != undefined) {
    //remove < and > signs and replace with &lt; and &gt;
    //needs to happen before markdown replacement
    note.body = note.body.replace(new RegExp('<', 'g'), '&lt;');
    note.body = note.body.replace(new RegExp('>', 'g'), '&gt;');;

    note.body = marked(note.body);

    //remove id tags (which were inserted by the marked() function)
    note.body = note.body.replace(new RegExp(' id="[^\"]*"', 'g'), '');


  }

  var client = new Evernote.Client({token: user.evernoteAuthToken, sandbox: false});
  var noteStore = client.getNoteStore();

  var newNote = new Evernote.Note();
  newNote.title = note.title;
  newNote.tagNames = note.tags;
  newNote.content = nBodyHead + note.body + nBodyFoot;


  //if Dropbox File Id and Evernote Guid are in database, this is an update
  getDropboxEvernoteFile(dropboxFileId, user, function(err, fileData) {
    if (err) {
      return ErrorHandler.LogError('getDropboxEvernoteFile(): ' + err, user.email);
    }

    console.log('fileData.Item: ' + JSON.stringify(fileData.Item));

    if (fileData.Item != undefined) { //update existing note

      console.log('Updating existing file');
      console.log('EvernoteGuid: ' + fileData.Item.EvernoteGuid.S);

      note.guid = fileData.Item.EvernoteGuid.S;
      newNote.guid = fileData.Item.EvernoteGuid.S;

      noteStore.updateNote(newNote, function(err, evernote) {

        if (err) {
          //if a "not found" error, then delete the existing db row and insert new
          if (err == "EDAMNotFoundException") {
            console.log("EDAMNotFoundException when updating note. Preparing to delete this row from DropboxEvernoteFile and insert new");
            deleteDropboxEvernoteFile(dropboxFileId, user, function(err, deleteData) {
              sendToEvernote(data, dropboxFileId, evernoteAuthToken, function() {
                callback();
              });
            });
          }
          else {
            console.log('updateNote err: ' + err);
            return ErrorHandler.LogError('updateNote: ' + JSON.stringify(err, null, 2), user.email);
          }

        }
        else {
          console.log('Successfully updated file');
          callback();
        }

      });

    }
    else { //insert new note

      console.log('creating new file.');
      console.log('----');
      console.log(JSON.stringify(newNote));
      console.log('----');

      //attempt to create note in evernote account
      noteStore.createNote(newNote, function(err, evernote) {
        if (err) {
          console.log('newNote: ' + JSON.stringify(newNote, null, 2));
          console.log('Evernote err: ' + JSON.stringify(err));
          //if (err == 'EDAMUserException')
          //  return ErrorHandler.LogError('Error when connecting to Evernote.\n\nIt appears that your Evernote authorization is invalid or expired. This error can usually be fixed by going to the Gnotes home page and reauthorizing your accounts.\n\nhttps://notes.giggy.com\n\nYou can reply to this email for support.', user.email);
          //else
          return ErrorHandler.LogError('noteStore.createNote: ' + err, user.email);
        }

        console.log('Created evernote note. Guid: ' + evernote.guid);
        note.guid = evernote.guid;

        //save this id/guid to the DropboxEvernote table so it can be updated in the future
        insertDropboxEvernoteFile(dropboxFileId, note.guid, user, function(err, data) {
          if (err) {
            return ErrorHandler.LogError('insertDropboxEvernoteFile: ' + err, user.email);
          }

          console.log('Inserted row into DBENFile');

          //if no error, return successfully
          callback();
        });


      });

    }
  });

}

function loopFiles(x, filesData, user, callback) {

  var sns = new AWS.SNS();

  console.log('Entering loopFiles()');
  console.log('filesData.entries.length: ' + filesData.entries.length);
  console.log('x: ' + x);

  if (x < filesData.entries.length) {

    if (filesData.entries[x].id != undefined) {

      _thisFile = filesData.entries[x];

      console.log('Preparing to downloadFile(): ' + _thisFile.path_lower);

      //if .md, process as markdown and send to evernote
      _ext = path.extname(_thisFile.path_lower);
      if (_ext === '.md' || _ext === '.txt') {




        //push to SNS so it can be processed and pushed to Evernote
        sns.publish({
           TopicArn: 'arn:aws:sns:us-east-1:420261107226:Evernote_File_Update',
           Message: JSON.stringify(user)
        }, function(err, data) {
            if (err) {
                return ErrorHandler.LogError(err);
            }
            console.log('published user to SNS topic Evernote_File_Update');
            console.log('data: \n---' + data + '---');
        });





        //call dropbox and retrieve file
        downloadFile(_thisFile.path_lower, user, function(err, fileContent) {
          if (err) {
            return ErrorHandler.LogError("downloadFile: " + err, user.email);
          }


          console.log('Preparing to enter sendToEvernote()');

          //convert markdown to html, process file at Evernote
          sendToEvernote(fileContent, _thisFile.id, user, function(err, note) {
            if (err) {
              return ErrorHandler.LogError('sendToEvernote: ' + err, user.email);
            }

            console.log('successfully posted file ' + _thisFile.id + ' to Evernote');
            loopFiles(x+1, filesData, user, callback);

          });

        });


      }
      else {
        //else error (in future would be good to send to evernote as attachment)
        //but continue looping first
        loopFiles(x+1, filesData, user, callback);

        console.log("This file is not .txt or .md. Doing nothing with it...");
        return ErrorHandler.LogError('The Gnotes service only processes files with a .txt or .md extension. Your recent file with extension ' + _ext + ' will not be synced to Evernote.', user.email);
      };

    }
    else { //probably a deleted file, so move to next record
      loopFiles(x+1, filesData, user, callback);
    }


  }
  else {
    console.log('Callback from loopFiles');

    callback();
  }

}

function main(dropboxUserId, mainCallback) {

  var user = new User();
  user.dropboxUserId = dropboxUserId;

  //get the auth_token and cursor for the user
  getUser(user.dropboxUserId, function(err, userData) {
    if (err) {
      return ErrorHandler.LogError("getUser: " + err);
    }

    console.log('userData: ' + JSON.stringify(userData));

    user.dropboxFileCursor = userData.Item.DropboxFileCursor.S;
    user.dropboxAuthToken = userData.Item.DropboxAuthToken.S;
    user.evernoteAuthToken = userData.Item.EvernoteAuthToken.S;
    user.email = userData.Item.Email.S;

    //call db and get files that have changed since last cursor was retrieved
    getChangedFiles(user, function(err, filesData) {
      if (err) {
        return ErrorHandler.LogError("getChangedFiles: " + err, user.email);
      }

      loopFiles(0, filesData, user, function(err, result) {

        console.log('done looping files');

        //update dropbox cursor
        updateCursor(user, filesData.cursor, function(err, data) {
          if (err) {
            return ErrorHandler.LogError("updateCursor(): " + err, user.email);
          }

          console.log('Done updating cursor');

          mainCallback(null, 'success');
        });

      });

    });

  });

}
