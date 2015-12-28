var AWS = require('aws-sdk');
AWS.config.update({
  region: "us-east-1",
});

exports.LogError = function(error) {

  console.log('Sending an error email to the user');

  var ses = new AWS.SES();
  var to = ['tgiggy@gmail.com'];
  var from = 'travis@giggy.com';
  ses.sendEmail( {
     Source: from,
     Destination: { ToAddresses: to },
     Message: {
         Subject: {
            Data: 'Error ' + arguments.callee.caller.name
         },
         Body: {
             Text: {
                 Data: 'An error occurred with Gnotes:\n\n' + error
             }
          }
     }
  }, function(err, data) {
      if(err)
        throw('Error sending error message to SES: ' + err);

      console.log('Email sent:');
      console.log(data);

      console.log('Pushing an error to SNS: ' + error);

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
      });
  });



};
