# FAQ

<h2 class="m-t-lg">WTF?</h2>

Basically, I really like Evernote. But I don't like the interface to Evernote. As a coder, I like the interface to [Atom](https://atom.io/), [Sublime Text](http://www.sublimetext.com), and [iTerm](https://www.iterm2.com).

Markdown is a beautiful thing, and I prefer to write notes with markdown formatting. Evernote doesn't let me use markdown.

I like to write a lot of notes and Evernote isn't the most convenient thing to pull up.

Sometimes I like to write very long notes and Evernote gets laggy.

I don't like to rely on a third party service to hold all my content, so it's nice to have a local copy of everything.

And... I was curious about AWS Lambda and needed a good test project.

## How does it work?

Just save a text file with a `.md` extension in your Dropbox connected Gnotes folder. The first line is the title of the resulting Evernote note. When you connect your Dropbox and Evernote accounts the first time, I create a sample text file inside your Dropbox folder.

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

It works pretty good for me :) But I wouldn't rely on Gnotes for very important applications.

If the service fails you *should* get an email notification, and I will get one too. If you get an email, it will include as much info as I received. Try again. If it continues to fail, [get in touch](/contact).

## What is the technical architecture?

All code is available for review at:

[https://github.com/tgig/Gnotes](https://github.com/tgig/Gnotes)

### AWS
  * API Gateway
  * Lambda
  * SNS
  * DynamoDB
  * S3
  * Cloudfront

### Signup

![Signup Process Flow AWS, Dropbox, Evernote](/images/ProcessFlow-Signup.png)

  1. Site is hosted on S3. Clicking the "Connect Dropbox" button sends you to Dropbox for authorization. Dropbox sends back a code.
  2. Call Lambda with the Dropbox code.
  3. Call Dropbox to retrieve the authentication token.
  4. Call Evernote to retrieve the OAuth url used for API authentication.
  5. Save Dropbox authentication token and email address to DynamoDB. If new user, create a new row, if existing user, update.
  6. Send success back to S3.
  7. When you clicks "Connect Evernote" button, sends you to Evernote for authorization. Evernote sends back a code.
  8. Call Lambda with the Evernote code. Authentication token is created.
  9. Save Evernote auth token to DynamoDB.
  10. Send success message back to S3, display success page.

### Dropbox to Evernote

![Save Note Process Flow, AWS, Dropbox, Evernote](/images/ProcessFlow-SaveNote.png)

  1. Dropbox Webhook calls Lambda (DB-accept-webhook) function via API Gateway url
  2. Lambda writes to SNS
  3. SNS calls another Lambda (DB-retrieve-files) which then,
  4. Retrieves user record from DynamoDB using Id from Dropbox webhook
  5. Gets list of changed files from Dropbox
  6. Loops through list and retrieves file content from Dropbox
  7. If file is a markdown `.md` file, convert markdown to funky Evernote XML format then upload to Evernote
  8. If new note, save Dropbox File Id and Evernote Guid to DynamoDB


## Do you have a mobile app?

[Jottings](http://jottingsapp.com/) is a great app to see all your notes on iOS. Just point the Dropbox folder to Gnotes and you can write notes on mobile the same way you do on your computer.

## If I modify an existing `.md` file in my Dropbox folder, will the changes be synced to Evernote?

All `.md` file mods will sync. I.e., if you edit an existing `.md` file in your Dropbox folder and save it, you should see those mods in Evernote within a few seconds.

## Will my changes in Evernote get synced back to my text file?

No. I don't currently modify your text files at all. If you make a change in Evernote, it will not reflect back in the original text file it originated from.

## Can I download an older Evernote note into a local text file?

No

## Will you please add XYZ and ABC features?

Submit an Issue on Github and we'll chat about it.

[https://github.com/tgig/Gnotes](https://github.com/tgig/Gnotes)


