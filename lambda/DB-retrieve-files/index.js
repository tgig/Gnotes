var https = require('https');
var AWS = require("aws-sdk");
var marked = require("marked");
var Evernote = require('evernote').Evernote;
var yaml = require('yaml-front-matter');
var moment = require('moment');

AWS.config.update({
  region: "us-east-1",
  //endpoint: "http://localhost:8000"
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
      throw("Error in main(): " + err);
    }

    context.succeed(data);

    context.done( );

  });

}

/*
----------
Vars and Objects
*/

function User(dropboxUserId, dropboxFileCursor, dropboxAuthToken, evernoteAuthToken) {
    this.dropboxUserId = dropboxUserId;
    this.dropboxFileCursor = dropboxFileCursor;
    this.dropboxAuthToken = dropboxAuthToken;
    this.evernoteAuthToken = evernoteAuthToken;
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

function _downloadFile(path, file, authToken, callback) {
  var _return = '';

  //set options to call dropbox api
  var options = {
    hostname: 'content.dropboxapi.com',
    path: path,
    port: 443,
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + authToken,
      'Dropbox-API-Arg': file
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
  req.write('');
  req.end();

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
      callback(new Error(err));
    }
    else {
      callback(null, data);
    }
  });

}

function getDropboxEvernoteFile(dropboxFileId, callback) {

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
      callback(new Error(err));
    }
    else {
      callback(null, data);
    }
  });

}


function insertDropboxEvernoteFile(dropboxFileId, evernoteGuid, callback) {

  var params = {
    TableName: "DropboxEvernoteFile",
    Item: {
      "DropboxFileId": {"S": dropboxFileId},
      "EvernoteGuid": {"S": evernoteGuid}
    }
  }

  dynamodb.putItem(params, function(err, data) {
    if (err)
      callback(new Error(err));
    else
      callback(null, data);
  });

}

function updateCursor(dropboxFileId, dropboxFileCursor, callback) {

  var params = {
    TableName: "DropboxEvernoteUser",
    Key: {
      "DropboxUserId": {
        "N": dropboxFileId.toString()
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
      callback(new Error(err));
    else
      callback(null, data);
  });
}
/*
End - Database operations
--------------
*/


//call DropBox with the authToken and cursor and retrive list of recently modified files
function getChangedFiles(cursor, authToken, callback) {

  _path = '/2/files/list_folder/continue';
  _cursor = '{\"cursor\": \"' + cursor + '\"}';
  _authToken = authToken;

  _getChangedFiles(_path, _cursor, _authToken, function(err, data) {
    if (err) {
      callback(new Error('Error in _getChangedFiles: ' + err));
      return;
    }

    callback(null, data);
  });

}

function downloadFile(fileName, authToken, callback) {
  _path = '/2/files/download';
  _file = '{\"path\": \"' + fileName + '\"}';

  _downloadFile(_path, _file, authToken, function(err, data) {
    if (err) {
      callback(new Error("Error in _downloadFile: " + err))
      return;
    }

    callback(null, data);
  })
}

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
  else if (content.length < _length) {
    title = content;
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

  if (doc.tags != undefined)
    note.tags = doc.tags;

  note.body = doc.__content.trim();

  return note;

}

function sendToEvernote(data, dropboxFileId, evernoteAuthToken, callback) {

  console.log('entering sendToEvernote');

  var nBodyHead = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
                  "<!DOCTYPE en-note SYSTEM \"http://xml.evernote.com/pub/enml2.dtd\">" +
                  "<en-note>";
  var nBodyFoot = "</en-note>";

  //parse YAML out of head
  var note = parseNote(data);

  //convert markdown to HTML
  if (note.body != undefined) {
    note.body = marked(note.body);

    //remove id tags (which were inserted by the marked() function)
    note.body = note.body.replace(new RegExp(' id="[^\"]*"', 'g'), '');

  }


  var client = new Evernote.Client({token: evernoteAuthToken});
  var noteStore = client.getNoteStore();

  var newNote = new Evernote.Note();
  newNote.title = note.title;
  newNote.content = nBodyHead + note.body + nBodyFoot;


  //if Dropbox File Id and Evernote Guid are in database, this is an update
  getDropboxEvernoteFile(dropboxFileId, function(err, fileData) {
    if (err) {
      throw('Error in getDropboxEvernoteFile(): ' + err);
    }

    console.log('fileData.Item: ' + JSON.stringify(fileData.Item));

    if (fileData.Item != undefined) { //update existing note

      console.log('Updating existing file');
      console.log('EvernoteGuid: ' + fileData.Item.EvernoteGuid.S);

      note.guid = fileData.Item.EvernoteGuid.S;
      newNote.guid = fileData.Item.EvernoteGuid.S;

      noteStore.updateNote(newNote, function(err, evernote) {
        if (err) {
          throw('Error in updateNote: ' + err);
        }

        console.log('Successfully updated file');

        callback();
      });

    }
    else { //insert new note

      console.log('creating new file');

      //attempt to create note in evernote account
      noteStore.createNote(newNote, function(err, evernote) {
        if (err) {
          throw('Error in createNote: ' + err);
        }

        note.guid = evernote.guid;

        //save this id/guid to the DropboxEvernote table so it can be updated in the future
        insertDropboxEvernoteFile(dropboxFileId, note.guid, function(err, data) {
          if (err) {
            throw('error in insertDropboxEvernoteFile: ' + err);
          }

          //if no error, return successfully
          callback();
        });


      });

    }
  });

}

function loopFiles(x, filesData, user, callback) {

  console.log('Entering loopFiles()');
  console.log('filesData.entries.length: ' + filesData.entries.length);
  console.log('x: ' + x);

  if (x < filesData.entries.length) {

    if (filesData.entries[x].id != undefined) {

      _thisFile = filesData.entries[x];

      console.log('thisFile: ' + _thisFile.path_lower);

      //call dropbox and retrieve file
      downloadFile(_thisFile.path_lower, user.dropboxAuthToken, function(err, fileContent) {
        if (err) {
          throw("Error in downloadFile: " + err);
        }

        //if .md or .txt, process as markdown and send to evernote
        _ext = _thisFile.path_lower.slice(-3);
        if (_ext === 'txt' || _ext === '.md') {



          //convert markdown to html, process file at Evernote
          sendToEvernote(fileContent, _thisFile.id, user.evernoteAuthToken, function(err, note) {
            if (err) {
              throw('Error in sendToEvernote: ' + err);
            }

            console.log('successfully posted file ' + _thisFile.id + ' to Evernote');
            loopFiles(x+1, filesData, user, callback);

          });

        }
        else {
          //else send to evernote as an attachment
          console.log("This file is not .txt or .md. Doing nothing with it...");
        }

      });
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
      throw("Error in getUser: " + err);
    }

    console.log('userData: ' + JSON.stringify(userData));

    user.dropboxFileCursor = userData.Item.DropboxFileCursor.S;
    user.dropboxAuthToken = userData.Item.DropboxAuthToken.S;
    user.evernoteAuthToken = userData.Item.EvernoteAuthToken.S;

    //call db and get files that have changed since last cursor was retrieved
    getChangedFiles(user.dropboxFileCursor, user.dropboxAuthToken, function(err, filesData) {
      if (err) {
        throw("Error in getChangedFiles: " + err);
      }

      console.log('filesData: ' + JSON.stringify(filesData));

      filesData = JSON.parse(filesData);

      loopFiles(0, filesData, user, function(err, result) {

        console.log('done looping files');

        //update dropbox cursor
        updateCursor(user.dropboxUserId, filesData.cursor, function(err, data) {
          if (err) {
            throw(new Error("Error in updateCursor(): " + err));
          }

          console.log('Done updating cursor');

          mainCallback(null, 'success');
        });

      });

    });

  });

}
