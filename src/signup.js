$(document).ready(function() {
  var fields = {
        user: {timer: 0, valid: false, check: checkUser, ajax: undefined},
        pass: {timer: 0, valid: false, check: checkPass, ajax: undefined},
        conf: {timer: 0, valid: false, check: confPass}
      }
    , valid = false, ajax = undefined

  $('#s_user').on('input', fields.user, setCheckerTimer)
  $('#s_pass').on('input', fields.pass, setCheckerTimer)
  $('#s_pass_conf').on('input', fields.conf, setCheckerTimer)

  $("#signup").submit(verifySubmit)

  function verifySubmit(ev) {
    var that = this
    if (valid) {
      if (ajax) ajax.abort()
      ajax = $.ajax({
        type: "POST",
        url: '/api/v1/auth/register',
        data: $(that).serialize(),
        dataType: "json",
        error: function(jqXHR, textStatus, errorThrown) {
          $('#s_submit').parent().children(".icon").addClass('err').removeClass("hidden green")
        },
        success: function(data) {
          if (data.user) {
            if (data.user.valid) {
              fields.user.valid = data.user.valid
              $('#s_user').parent().children(".icon").removeClass("err").addClass("green").html("&#xF007;")
            } else {
              if (data.user.err) $('#err_msg').text(data.user.err)
              $('#s_user').parent().children(".icon").removeClass("green").addClass("err").html("&#xF071;")
            }
          }
          if (data.pass) {
            if (data.pass.valid) {
              fields.pass.valid = data.pass.valid
              $('#s_pass').parent().children(".icon").removeClass("err").addClass("green").html("&#xF084;")
            } else {
              if (data.pass.err) $('#err_msg').text(data.pass.err)
              $('#s_pass').parent().children(".icon").removeClass("green").addClass("err").html("&#xF071;")
            }
          }
          checkValidated()
          if (data.err) {
            if (data.err) $('#err_msg').text(data.err)
            $('#s_submit').parent().children(".icon").addClass('err').removeClass("hidden green")
          } else if (data.registered) {
            $('#s_submit').parent().children(".icon").removeClass("err hidden").addClass("green").html("&#xF00C;")
            $('#s_submit').addClass('disabled grayed')

            $.ajax({
              type: "POST",
              url: '/api/v1/auth/login',
              data: $(that).serialize(),
              dataType: "json",
              error: function(jqXHR, textStatus, errorThrown) {
                $('#err_msg').text(textStatus)
                console.log(textStatus)
                console.log(jqXHR)
              },
              success: function(data) {
                if (data.error) {
                  $("#auth-err").show().text(data.error)
                  $('#err_msg').text(data.error)
                } else if (data.success) {
                  $("#auth-success").show().text(data.success)
                  $("#auth").html(data.html)
                  $('.login').addClass('hidden')
                  $('.blurable').removeClass('blur')
                  $('#cover').removeClass('show_cover')
                  $('#auth').addClass('faint')
                }
              },
              timeout: 60000
            })
          }
        },
        timeout: 10000
      })
    }
    return false
  }

  function setCheckerTimer(ev) {
    ev.data.valid = false
    checkValidated()
    window.clearTimeout(ev.data.timer)
    ev.data.timer = window.setTimeout(ev.data.check, 1100)
  }

  function checkValidated() {
    if (valid = (fields.user.valid && fields.pass.valid && fields.conf.valid)) {
      $('#err_msg').text('')
      $('#s_submit').removeClass('disabled grayed')
    } else {
      $('#s_submit').addClass('disabled grayed')
    }
  }

  function checkEmpty() {
    if ($('#s_user').val().length < 1 && $('#s_pass').val().length < 1) {
      $('#err_msg').text('')
    }
  }

  function checkUser() {
    var input, val, self = fields.user
    input = $('#s_user')
    val = input.val()
    self.valid = false
    if (val === undefined || val === null || val.length < 1) {
      checkEmpty()
      input.parent().children(".icon").removeClass("green err").html("&#xF007;")
    } else {
      if (self.ajax) self.ajax.abort()
      self.ajax = $.ajax({
        type: "POST",
        url: '/api/v1/auth/validate',
        contentType: "application/json",
        data: JSON.stringify({ username: val }),
        dataType: "json",
        error: function(jqXHR, textStatus, errorThrown) {
          self.valid = false
          $('#err_msg').text(textStatus)
          console.log(textStatus)
          console.log(jqXHR)
          input.parent().children(".icon").removeClass("green").addClass("err").html("&#xF071;")
        },
        success: function(data) {
          if (data.user.valid) {
            self.valid = data.user.valid
            input.parent().children(".icon").removeClass("err").addClass("green").html("&#xF007;")
          } else {
            self.valid = false
            if (data.user.err) $('#err_msg').text(data.user.err)
            input.parent().children(".icon").removeClass("green").addClass("err").html("&#xF071;")
          }
          checkValidated()
        },
        timeout: 5000
      })
    }
  }

  function checkPass() {
    var input, val, self = fields.pass
    input = $('#s_pass')
    val = input.val()
    self.valid = false
    confPass()
    if (val === undefined || val === null || val.length < 1) {
      checkEmpty()
      input.parent().children(".icon").removeClass("green err").html("&#xF084;")
    } else {
      if (self.ajax) self.ajax.abort()
      self.ajax = $.ajax({
        type: "POST",
        url: '/api/v1/auth/validate',
        contentType: "application/json",
        data: JSON.stringify({ password: val }),
        dataType: "json",
        error: function(jqXHR, textStatus, errorThrown) {
          self.valid = false
          $('#err_msg').text(textStatus)
          console.log(textStatus)
          console.log(jqXHR)
          input.parent().children(".icon").removeClass("green").addClass("err").html("&#xF071;")
        },
        success: function(data) {
          if (data.pass.valid) {
            self.valid = data.pass.valid
            input.parent().children(".icon").removeClass("err").addClass("green").html("&#xF084;")
          } else {
            self.valid = false
            if (data.pass.err) $('#err_msg').text(data.pass.err)
            input.parent().children(".icon").removeClass("green").addClass("err").html("&#xF071;")
          }
          checkValidated()
        },
        timeout: 5000
      })
    }
  }

  function confPass() {
    var input, val, self = fields.conf
    input = $('#s_pass_conf')
    val = input.val()
    if (val === undefined || val === null || val.length < 1) {
      self.valid = false
      input.parent().children(".icon").removeClass("green err").addClass('invert').html("&#xF064;")
    } else if (val !== $('#s_pass').val()) {
      self.valid = false
      input.parent().children(".icon").removeClass("green invert").addClass("err").html("&#xF119;")
    } else {
      self.valid = true
      input.parent().children(".icon").removeClass("err invert").addClass("green").html("&#xF00C;")
    }
    checkValidated()
  }
})
