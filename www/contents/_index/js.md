<script>

  function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  }

  $(function() {
    var code = getParameterByName('code');

    if (code != '') {
      $('#dropboxButton').addClass('disabled');

      postData = {
        "code": code
      }

      $.ajax({
        url: 'https://hir9ezqm9l.execute-api.us-east-1.amazonaws.com/prod/get-dropbox-token',
        method: 'POST',
        contentType:"application/json; charset=utf-8",
        dataType:"json",
        data: JSON.stringify(postData)
      })
      .done(function(data) {
        console.log('success');
        console.log('data: ' + JSON.stringify(data));
      })
      .fail(function(err) {
        console.log( "error" );
        console.log("error: " + JSON.stringify(err));
      })
      .always(function() {
        console.log( "complete" );
      });

      function callme(data) {
        console.log('callme');
        console.log(data);
      }

      /*


      ,
        success: function(data) {
          console.log('success');
          console.log('data: ' + JSON.stringify(data));
        },
        fail: function(data) {
          console.log('error');
          console.log(data);
        }
      */

    }
  });


</script>
