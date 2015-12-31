var AWS = require('aws-sdk');
AWS.config.update({
  region: "us-east-1",
});
require("dotenv").load({path: './.env'});

exports.LogError = function(error, email) {

  PushToSNS(error, function(snsErr, snsData) {
    if (snsErr)
      throw('Error in LogError.PushToSNS: ' + snsErr);

    console.log('PushToSNS data: ' + snsData);

    if (email != undefined) {
      SendUserEmail(error, email, function(emailErr, emailData) {
        if (emailErr)
          throw('Error in LogError.SendUserEmail: ' + emailErr);

        console.log(emailData);
      });
    }

  });

};

function PushToSNS(error, callback) {
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
      callback(data);
  });
}

function SendUserEmail(error, email, callback) {
  if (email == '' || email == undefined)
    throw('Invalid email, exiting LogError.SendUserEmail');

  console.log('Sending an error email to the user: ' + email);

  var ses = new AWS.SES();

  var to = [email];
  var from = process.env.admin_email;
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
      callback(data);
  });

}
