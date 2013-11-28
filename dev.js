
// This file is for editing accounts.

// Import all the stuffs!
var express = require('express')
  	, passport = require('passport')
  	, mongoose = require('mongoose')
  	, passportLocalMongoose = require('passport-local-mongoose')
  	, keys = require(__dirname + '/keys.json')
  	, db
	, rl = require('readline').createInterface(process.stdin, process.stdout)
	, types = /user|mod|admin/
	, request = require('request');

// Connect to auth
db = mongoose.createConnection(keys.passport.database, {
	db: {
		native_parser: true
	},
	server: {
		poolSize: 5,
		auto_reconnect: true
	}
});

db.on('error', console.error.bind(console, 'Auth connection error:'));

require('./app/server/models/account')(db, function(Account) {
	passport.use(Account.createStrategy());
	passport.serializeUser(Account.serializeUser());
	passport.deserializeUser(Account.deserializeUser());

	rl.on('line', function(line) {
		line.trim()
		if (/pig/i.test(line)) {
			console.log('   ‚‚\n! ∞¨ ⁻⁻)⧜\n   ˙˙˙˙');
		} else if (/edit/i.test(line)) {
			var res = line.split(' ');
			if (res.length === 3 && res[1] !== null && res[2] !== null) {
				console.log('Finding ' + res[1] + ' to update to ' + res[2]);
				if (types.test(res[2])) {
					Account.findByUsername(res[1], function(err, doc) {
						doc.update({ type: res[2] }, function(err, doc) {
							console.log('Successfully updated ' + res[1] + ' to ' + res[2]);
						});
					});
				}
			}
		} else if (/register/i.test(line)) {
			var res = line.split(' ');
			if (res.length === 3 && res[1] !== null && res[2] !== null) {
				request.post('http://127.0.0.1:8080/register',
	   				{ form: { username: res[1], password: res[2] } },
	    			function (err, resp, body) {
	        			if (err) {
	        				console.log(err);
	        			} else {
	        				console.log(resp);
	           				console.log(body)
				        }
				});
			}
		} else if (/delete|remove/i.test(line)) {
			var res = line.split(' ');
			if (res.length === 2 && res[1] !== null) {
				Account.findByUsername(res[1], function(err, doc) {
					rl.question('Are you sure you want to remove ' + doc.username + ' (y / n)?\n', function(ans) {
						if (/y|yes/i.test(ans)) {
							doc.remove(function(err) {
								if (err) {
									console.log(err);
								} else {
									console.log('Permanently removed ' + doc.username + ' from the user database.');
								}
							});
						}
					})
				});
			}
		} else if (/raw|dump/i.test(line)) {
			var res = line.split(' ');
			if (res.length === 2 && res[1] !== null) {
				Account.findByUsername(res[1], function(err, doc) {
					if (err) {
						console.log(err);
					}
					console.log(doc);
				});
			}
		} else if (/list/i.test(line)) {
			Account.find({}).exec(function(err, docs) {
				if (err) {
					console.log(err);
				} else if (docs !== null) {
					for (var i = 0; i < docs.length; i++) {
						console.log('~' + i);
						console.log('    username: ' + docs[i].username);
						console.log('    _id: ' + docs[i]._id);
						console.log('    hash_version: ' + docs[i].hash_version);
						console.log('    type: ' + docs[i].type);
					}
				}
			});
		} else if (/kill|die|terminate|stop|close|exit/i.test(line)) {
			rl.close();
		}
	}).on('close', function() {
		console.log('Closed dev account editor.');
		process.exit(0);
	});

	console.log('Dev account editor now running');
});