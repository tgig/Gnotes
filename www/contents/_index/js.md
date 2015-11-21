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
        code: code,
        grant_type: "authorization_code",
        client_id: "1234",
        client_secret: "hello",
        redirect_uri: "http://localhost:9009"
      }

      //can I retrieve token from dropbox from the client side?
      $.post('https://api.dropboxapi.com/1/oauth2/token', { code: code, grant_type: "authorization_code" }, function(data) {
        alert('data: ' + data);
      })
    }
  });


</script>
