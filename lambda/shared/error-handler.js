var AWS = require('aws-sdk');

exports.LogError = function(error) {

  var sns = new AWS.SNS();
  sns.publish({
     TopicArn: 'arn:aws:sns:us-east-1:420261107226:Dropbox_Evernote_Error_Email',
     Subject: 'Error ' + arguments.callee.caller.name,
     Message: error
  }, function(err, data) {
      if (err) {
          throw('Error pushing error messge to SNS: ' + err);
      }
      console.log('Error message pushed to SNS');
      console.log(data);
      throw(new Error('Error message pushed to SNS: ' + errorSubject + '\n' + errorMessage));
  });
};
