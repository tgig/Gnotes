var AWS = require('aws-sdk');
AWS.config.update({
  region: "us-east-1",
});
require("dotenv").load({path: './.env'});

exports.LogError = function(error, email) {

  //send an error email to the admin
  SendUserEmail(error, process.env.admin_email, function(emailErr, emailData) {
    if (emailErr)
      throw('Error in LogError.SendUserEmail: ' + emailErr);

    console.log(emailData);
  });

  //send an error email to the user
  if (email != undefined) {
    SendUserEmail(error, email, function(emailErr, emailData) {
      if (emailErr)
        throw('Error in LogError.SendUserEmail: ' + emailErr);

      console.log(emailData);
    });
  }

};

function SendUserEmail(error, email, callback) {

  var ses = new AWS.SES();

  console.log('Sending an error email to the user: ' + email);

  if (email == '' || email == undefined)
    throw('Invalid email, exiting LogError.SendUserEmail');

  var to = [email];
  var from = process.env.admin_email;
  ses.sendEmail( {
     Source: from,
     Destination: { ToAddresses: to },
     Message: {
         Subject: {
            Data: 'Gnotes Error ' + arguments.callee.caller.name
         },
         Body: {
             Text: {
                 Data: 'An error occurred with Gnotes:\n\n' + error + '\n\nYou can reply to this email for support.'
             }
          }
     }
  }, function(err, data) {
      if(err)
        throw('Error sending error message to SES: ' + err);

      console.log('Email sent:');
      callback(null, data);
  });

}
