# FAQ

## WTF?

Basically, I really like Evernote. But I don't like the interface to Evernote. As a coder, I like the interface to Atom and Sublime Text.

I like to write a lot of notes and Evernote isn't the most convenient thing to pull up.

Sometimes I like to write very long notes and Evernote gets laggy.

I don't like to rely on a third party service to hold all my content, so it's nice to have a local copy of everything.

And... I was curious about AWS Lambda and needed a good test project.

## Why do I need to connect Dropbox and Evernote?

When you save a `.md` file to your connected Dropbox folder, Gnotes receives a webhook notice. The content of your `.md` file is pulled by an AWS Lambda, converted to the wonky Evernote XML format, and uploaded.

## Do you save my content?

The Gnotes AWS Lambda pulls your content from Dropbox, converts it to Evernote XML, and uploads to Evernote. I save some metadata about the transaction like the Dropbox file id and the Evernote file id, but none of your content is saved. There is also some lightweight data about the file saved temporarily into log files for troubleshooting, but no content.

## Don't you need my email address?

Yep, it gets snagged from Dropbox after you authorize access a specific folder. I *probably* won't spam you :)

Gnotes will send an email when a note you saved to Dropbox is not successfully saved to Evernote.  If you can't save a file successfully to Evernote, get in touch and I'll take a closer look.

## Is it free?

Yes, for now. I don't expect enough people to use this service for it to be a burden financially. If for some weird reason that happens, I'll figure it out then.

## Is it reliable?

You *should* get an email notification if a file is not successfully uploaded. I wouldn't rely on this for very important applications.

## What is the technical architecture?

All code is available for review at:

https://github.com/tgig/Markdown-to-Evernote

**AWS**
  * API Gateway
  * Lambda
  * SNS
  * DynamoDB
  * S3
  * Cloudfront

**Signup**
AWS S3 (static website) >
Dropbox (OAuth) >
AWS S3 (Dropbox returns code for request token) >
AWS Lambda (calls Dropbox to get token, saves to AWS DynamoDB, calls Evernote to get link for auth) >
AWS S3 (show Evernote button) >
Evernote (OAuth) >
AWS S3 (Receive pre-tokens from EN) >
AWS Lambda (use EN tokens to generate actual access token)

**Dropbox to Evernote**
Dropbox Webhook (when a file is added/modified) >
AWS Lambda (to receive webhook and write to SNS) >
SNS (to notify Lambda to retrieve file content) >
AWS Lambda (to retrieve file content from Dropbox, convert to Evernote XML, upload to Evernote) >

## What is your favorite color?

Orange

## Will you please add XYZ and ABC features?

Submit an Issue on Github and we'll chat about it.

[https://github.com/tgig/Markdown-to-Evernote](https://github.com/tgig/Markdown-to-Evernote)


