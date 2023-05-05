/* global before after */

require('dotenv').config();

const mongoose = require('mongoose');

mongoose.Promise = global.Promise;



//Before starting the test, create sandboxed database connection
//This all is mocha code, not jest
before(function (done) {
	mongoose.connect(process.env.DB_ROUTE, { useNewUrlParser: true, useUnifiedTopology: true });
	const db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error'));
	db.once('open', function () {
		console.log('We are connected to the test database');
		done();
	});
});

after(function(done) {
	try{
		mongoose.connection.close(done);
	}
	catch(err){
		console.log("Can't close connection currently");
	}
});
