
module.exports = {

  get: function(basepath, file_extension, options, callback) {
    //console.log('bar');

    options.header["Access-Control-Allow-Origin"] = "'*'";

    callback(null, {}, options);
  }

};
