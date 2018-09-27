# Defunked

GNotes is no longer active. Evernote decided my implementation was no bueno and disconnected it. I don't currently have the time to update the API, so GNotes will be non-functional until I come up for air... maybe never.

If you want to get it going again, read Issue #8 and submit a pull request.


# Gnotes

Basically, I really like Evernote. But I don't like the interface to Evernote. As a coder, I like the interface to Atom, Sublime Text, and iTerm.

Markdown is a beautiful thing, and I prefer to write notes with markdown formatting. Evernote doesn't let me use markdown.

I like to write a lot of notes and Evernote isn't the most convenient thing to pull up.

Sometimes I like to write very long notes and Evernote gets laggy.

I don't like to rely on a third party service to hold all my content, so it's nice to have a local copy of everything.

And... I was curious about AWS Lambda and needed a good test project.


## How it works

Uses Dropbox, Evernote, and AWS.

Connect your Dropbox and Evernote account. Save a markdown file into the Dropbox folder and it will sync to Evernote.

Sign up at [https://notes.giggy.com](https://notes.giggy.com)

Works like this:

1. Save a markdown file into your connected Dropbox folder
2. Dropbox webhook calls AWS API Gateway, which executes an AWS Lambda
3. AWS Lambda queues a job in SNS, which is connected to another AWS Lambda
4. Lambda #2 grabs the file from Dropbox, converts it to ENML, uploads to Evernote


### Hosted 100% on AWS:

* **API Gateway** - connecting to AWS Lambdas
* **Lambda** - all business logic
* **SNS** - connecting multiple Lambdas
* **DynamoDB** - save file id's
* **S3** - host website
* **Cloudfront** - CDN & enables an SSL certificate to be installed

![Signup Process Flow AWS, Dropbox, Evernote](https://notes.giggy.com/images/ProcessFlow-Signup.png)

![Save Note Process Flow, AWS, Dropbox, Evernote](https://notes.giggy.com/images/ProcessFlow-SaveNote.png)

## Repo structure

#### lambda

All AWS Lambdas and all business logic code is in this folder. There are two scripts used to develop and deploy to AWS:

  * `node run-lambda [folder name]` - Run this code in the terminal to execute the Lambda locally. Must have a folder named [folder name], with files named `index.js` and `event.json`
  * `node deploy-zip [folder name]` - Zips up Lambda code, node_modules, and shared files and uploads it to named AWS Lambda.

#### www

Built with [Punch](https://github.com/laktek/punch)

To run this on your local machine:

```
git clone https://github.com/tgig/Gnotes.git
npm install
punch s
```

Be sure to create a `.env` file.

Right now there are a few hard coded sections. Not ideal, but I don't really expect anybody else to be running versions of this on their own server any time soon.
