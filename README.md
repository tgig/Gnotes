# Gnotes

## Not ready for primetime, still under development (getting close though!)

Uses Dropbox, Evernote, and AWS.

Connect your Dropbox and Evernote account. Save a markdown file into the Dropbox folder and it will sync to Evernote.

Sign up at [https://notes.giggy.com](https://notes.giggy.com)

Works like this:

1. Save a markdown file into your connected Dropbox folder
2. Dropbox webhook calls AWS API Gateway, which executes an AWS Lambda
3. AWS Lambda queues a job in SNS, which is connected to another AWS Lambda
4. Lambda #2 grabs the file from Dropbox, converts it to ENML, uploads to Evernote

* * *


**Hosted 100% on AWS:**

* **API Gateway** - connecting to AWS Lambdas
* **Lambda** - all business logic
* **SNS** - connecting multiple Lambdas
* **DynamoDB** - save file id's
* **S3** - host website
* **Cloudfront** - CDN & enables an SSL certificate to be installed

## Repo structure

**lambda**

All AWS Lambdas and all business logic code is in this folder. There are two scripts used to develop and deploy to AWS:

  * `node run-lambda [folder name]` - Run this code in the terminal to execute the Lambda locally. Must have a folder named [folder name], with files named `index.js` and `event.json`
  * `node deploy-zip [folder name]` - Zips up Lambda code, node_modules, and shared files and uploads it to named AWS Lambda.

**www**

Built with [Punch](https://github.com/laktek/punch)

To run this on your local machine:

```
git clone https://github.com/tgig/Gnotes.git
npm install
punch s
```
