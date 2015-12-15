
module.exports = {

  get: function(basepath, file_extension, options, callback) {
    //console.log('bar');

    if (options.header)
      options.header["Access-Control-Allow-Origin"] = "'*'";

    callback(null, {}, options);
  }

};
