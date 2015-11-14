/*
  This Lambda will receive a Webhook from Dropbox and push a notification to SNS
*/

console.log('Starting DB-accept-webhook-post Lambda function');

var AWS = require('aws-sdk');

exports.handler = function(event, context) {
    console.log('preparing to read X-Dropbox-Signature header');

    //get header passed across by webhook to do light validation
    var dbSig = event.XDropboxSignature;
    var sns = new AWS.SNS();

    if (dbSig.length < 50) {
        console.log('Dropbox Sig may not be valid, exiting: ' + dbSig);
        context.done('You done messed up');
    }

    console.log('Request body: ' + JSON.stringify(event));

    for (var i in event.delta.users) {

        sns.publish({
           TopicArn: 'arn:aws:sns:us-east-1:420261107226:Dropbox_File_Update',
           Message: event.delta.users[i].toString()
        }, function(err, data) {
            if (err) {
                console.log(err.stack);
                return;
            }
            console.log('push sent');
            console.log(data);
            context.done(null, 'Function Finished');
        });
    }
}
