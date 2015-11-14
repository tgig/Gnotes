# Markdown to Evernote

Uses Dropbox, Evernote, AWS Lambdas, and AWS DynamoDB.

Connect your Dropbox and Evernote account. Save a markdown file into the Dropbox folder and it will sync to Evernote.

Works like this:

1. Save a markdown file into your connected Dropbox folder
2. Dropbox webhook calls AWS API Gateway, which executes an AWS Lambda
3. AWS Lambda queues a job in SNS, which is connected to another AWS Lambda
4. Lambda #2 grabs the file from Dropbox, converts it to ENML, uploads to Evernote

