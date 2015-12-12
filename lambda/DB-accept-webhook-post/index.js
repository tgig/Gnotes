/*
  This Lambda will receive a Webhook from Dropbox and push a notification to SNS
*/

var AWS = require('aws-sdk');

exports.handler = function(event, context) {
    console.log('preparing to read X-Dropbox-Signature header');

    var dbSig = event.XDropboxSignature;
    var sns = new AWS.SNS();

    if (dbSig.length < 50) {
        console.log('Dropbox Sig may not be valid, exiting: ' + dbSig);
        throw('Dropbox Auth Error. You done messed up');
    }

    console.log('Request body: ' + JSON.stringify(event));

    for (var i in event.delta.users) {
        console.log('i: ' + i);

        sns.publish({
           TopicArn: 'arn:aws:sns:us-east-1:420261107226:Dropbox_File_Update',
           Message: event.delta.users[i].toString()
        }, function(err, data) {
            if (err) {
                throw('Error pushing to SNS: ' + Err.stack);
            }
            console.log('push sent');
            console.log(data);
            context.done(null, 'Function Finished');
        });
    }
}
