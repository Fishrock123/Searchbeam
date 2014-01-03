var assert = require('assert')
  , Account;


// Export all the things!
exports.loadAuth = loadAuth;
exports.userAvaliable = userAvaliable;
exports.username = username;
exports.password = password;
exports.form = form;

function loadAuth(model) {
  Account = model;

  userAvaliable('fishrock123', function(res) {
    assert(res.err, '18');
  });
  userAvaliable('qq', function(res) { // Does not validate and should never be taken.
    assert(res.valid, '19');
  });
}

function userAvaliable(val, cb) {
  Account.findByUsername(val, function(err, doc) {
    if (doc === null) {
      cb({ err: null, valid: true });
    } else {
      cb({ err: 'Username has already been taken.' });
    }
  });
}

function username(val) {
  if (val === undefined
    || val === null) {
    return { err: 'Username does not exist.' };
  } else if (val.length < 3) {
    return { err: 'Username must be at least 3 characters long.' };
  } else if (val.length > 20) {
    return { err: 'Username must be no more than 20 characters long.' };
  } else if (/[^A-Za-z0-9_ -:.]/.test(val)) {
    return { err: 'Username may only contain letters, numbers, underscores, colons, periods, and spaces.' };
  } else if (!/[A-Za-z]{3,}/.test(val)) {
    return { err: 'Username must contain at least 3 letters.' };
  } else if (/[_ -:.]{4,}/.test(val)) {
    return { err: 'Username may have no more than 4 underscores, colons, periods, or spaces.' };
  } else {  // Todo: prevent names starting or ending with [ -.:]
    return { err: null, valid: true };
  }
}

function password(val, cb) {
  if (val === undefined
    || val === null) {
    return { err: 'Password does not exist.' };
  } else if (val.length < 10) {
    return { err: 'Password must be at least 10 characters long.' };
  } else if (val.length > 64) {
    return { err: 'Password must be no more than 64 characters long.' };
  } else { // The top 500 worst passwords are all under 10 characters long, so that alone should weed out many bad passwords.
    return { err: null, valid: true };
  }
}

function form(json, cb) {
  var out = {};
  if (json.password) {
    out.pass = password(json.password);
  }
  if (json.username) {
    out.user = username(json.username);
    if (out.user.valid) {
      userAvaliable(json.username, function(avali) {
        out.user = avali;
        cb(out);
      });
    }
  }
  if (out.user === undefined || out.user.err) {
    cb(out);
  }
}

assert(username('alex').valid, '1');
assert(username('Fishrock123').valid, '2');
assert(username('alex:smith').valid, '3');
assert(username('alex.smith').valid, '4');
assert(username('alex-smith').valid, '5');
assert(username('alex_smith').valid, '6');
assert(username('alex smith').valid, '7');
assert(username(':-alex-:').valid, '8');
assert(username('_alex::smith_').valid, '9');
assert(username('qq').err, '10');
assert(username('0123456789tentwenty21').err, '11');
assert(username('<BAD=USERnam###!?|').err, '12');
assert(username('<script>alert("xss")').err, '13');
assert(username(':-qq-:').err, '14');
assert(username('alex_:.:_smith').err, '15');

assert(password('G721khas821710shjs91naha').valid, '16'); // Completely random typing on my keyboard.
assert(password('password').err, '17');
