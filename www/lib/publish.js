require("dotenv").config({path: "../.env"});
var S3Publisher = require("../../node_modules/punch/lib/publishers/s3.js");
var fs = require("fs");
var AWS = require('aws-sdk');
var moment = require('moment');

module.exports = {

  publish: function(config, last_published_date, callback) {
    fs.readFile('./config.json', function(err, config) {
      if (err) {
        throw("can't find config.json");
      }

      config = JSON.parse(config);

      config.publish = {
          "strategy" : "custom_strategy",
          "options" : {
            "bucket" : process.env.aws_s3_bucket,
            "region" : process.env.aws_s3_region,
            "key" : process.env.aws_s3_key,
            "secret" : process.env.aws_s3_secret
          }
        }

      S3Publisher.publish(config, last_published_date, callback);

      //create CloudFront invalidation
      AWS.config.update({
        "accessKeyId": process.env.aws_cloudfront_key,
        "secretAccessKey": process.env.aws_cloudfront_secret,
        "region": "us-east-1"
      });
      var cf = new AWS.CloudFront();
      var params = {
        DistributionId: process.env.aws_cloudfront_distribution_id, // required
        InvalidationBatch: { // required
          CallerReference: moment().format('MMMM Do YYYY, h:mm:ss a'), // required
          Paths: { // required
            Quantity: 1, // required
            Items: [
              '/*'
            ]
          }
        }
      };
      cf.createInvalidation(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
      });
    });

  },

}
