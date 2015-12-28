<script>

  function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  }

  function setAuthWarning(enabled, content) {
    if (enabled) {
      $('#auth-warning').show();
      $('#auth-warning').text(content);
    }
    else {
      $('#auth-warning').hide();
      $('#auth-warning').text('');
    }
  }

  function sendToDropbox() {
    window.location.href = 'https://www.dropbox.com/1/oauth2/authorize?response_type=code&client_id=y8e16srolzb3ooc&redirect_uri=https%3A%2F%2Fnotes.giggy.com';
  }

  function showEvernoteButton(data) {
    $('#dropboxButton').hide();
    $('#step-1').css('text-decoration', 'line-through');
    $('#evernoteButton').attr('href', data.evernoteAuthorizeUrl);
    $('#evernoteButton').show();
  }

  function getDropboxToken(code) {
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
      if (data.errorMessage) {
        setAuthWarning(true, "Something went wrong in function showEvernoteButton(). Please click the back button and try again. If this error continues, get in touch.");
        console.log('Error: ' + JSON.stringify(data, null, 2));
        return;
      }

      //need to save/set the oauthSecret var, b/c it will be needed when evernote returns
      localStorage.setItem('dropboxUserId', data.dropboxUserId);
      localStorage.setItem('evernoteOAuthSecret', data.evernoteOAuthSecret);

      showEvernoteButton(data);
    })
    .fail(function(err) {
      setAuthWarning(true, 'An error occured while authorizing your Dropbox account. ' + JSON.stringify(err));
    });

  }


  function getEvernoteToken(oauthToken, oauthVerifier) {
    postData = {
      "dropboxUserId": localStorage.getItem('dropboxUserId'),
      "oauthToken": oauthToken,
      "oauthSecret": localStorage.getItem('evernoteOAuthSecret'),
      "oauthVerifier": oauthVerifier
    }

    console.log('postData: ' + JSON.stringify(postData, null, 2));

    $.ajax({
      url: 'https://hir9ezqm9l.execute-api.us-east-1.amazonaws.com/prod/get-evernote-token',
      method: 'POST',
      contentType:"application/json; charset=utf-8",
      dataType:"json",
      data: JSON.stringify(postData)
    })
    .done(function(data) {
      if (data.errorMessage) {
        setAuthWarning(true, "Something went wrong in function getEvernoteToken(). Please click the back button and try again. If this error continues, get in touch.");
        console.log('Error: ' + JSON.stringify(data, null, 2));
        return;
      }

      //should be all done. Redirect to next page...
      window.location = '/done.html';

    })
    .fail(function(err) {
      setAuthWarning(true, 'An error occured while getting your Evernote token: ' + JSON.stringify(err));
    });

  }



  $(function() {
    setAuthWarning(false);
    var code = getParameterByName('code');
    var oauthToken = getParameterByName('oauth_token');

    if (code != '') {
      $('#dropboxButton').addClass('disabled');
      $('#dropboxButton').text('Please wait...');

      getDropboxToken(code);

    }
    else if (oauthToken != '') {
      showEvernoteButton('');
      $('#evernoteButton').addClass('disabled');
      $('#evernoteButton').text('Please wait...');

      var oauthVerifier = getParameterByName('oauth_verifier');
      getEvernoteToken(oauthToken, oauthVerifier);
    }
  });


</script>
