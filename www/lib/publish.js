require("dotenv").config({path: "../.env"});
var S3Publisher = require("../../node_modules/punch/lib/publishers/s3.js");
var fs = require("fs");

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
    });

  },

}
