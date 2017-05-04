const express = require('express');
const http = require('http');
const url = require('url');
const app = express();
const crypto = require('crypto');

let id = Math.random().toString(36).substr(2, 9);
let serviceName = process.env.SERVICE_NAME;
let isHealth = true;
let highload = false;
let heavyWork = function() {
	for( let i = 0; i < 100000; i++ ) {
		const hash = crypto.createHash( 'sha256' );
		hash.update( Math.random().toString( 36 ) );
		hash.digest( 'hex' );
	}
	if(highload)
		setTimeout(heavyWork, 1);
};

app.get('/', function (req, res) {
	res.json({
		pid: id,
		serviceName: serviceName,
		date: new Date()
	});
});

app.get('/fail', function (req, res) {
	res.status(500).json({
		pid: id,
		serviceName: serviceName,
		status: "I'm a failure"
	});
});

app.get('/success', function (req, res) {
	res.status(200).json({
		pid: id,
		serviceName: serviceName,
		status: "I'm a success"
	});
});

app.get('/health', function (req, res) {
	res.status(isHealth ? 200 : 500).json({
		pid: id,
		serviceName: serviceName,
		status: "I'm "+(isHealth ? "" : "not ")+"healthy"
	});
});

app.get('/health/disable', function (req, res) {
	isHealth = false;
	res.json({
		pid: id,
		serviceName: serviceName,
		status: "Service is now unhealthy"
	});
});

app.get('/health/enable', function (req, res) {
	isHealth = true;
	res.json({
		pid: id,
		serviceName: serviceName,
		status: "Service is now healthy"
	});
});

app.get('/health/timeout/:seconds', function (req, res) {
	isHealth = false;
	setTimeout(function(){ isHealth = true; }, 1000*req.param('seconds'));
	res.json({
		pid: id,
		serviceName: serviceName,
		status: "Service is now unhealthy",
		timeout: req.param('seconds')
	});
});

app.get('/highload/:seconds', function (req, res) {

	if(!highload) {
		console.log( 'Starting highload at ' + serviceName + ' with ID: ' + id );
		highload = true;
		process.nextTick(heavyWork);
		setTimeout( function() {
			highload = false;
			console.log( 'Ending highload at ' + serviceName + ' with ID: ' + id );
		}, 1000 * req.param( 'seconds' ) );
	}

	res.json({
		pid: id,
		serviceName: serviceName,
		status: "Service is set to use all CPU available",
		timeout: req.param('seconds')
	});
});

app.get('/request/*', function (req, res) {
	let endpoint = "http://"+req.params[0];
	let client = http.request(endpoint, (r) =>
	{
		let output = '';
		r.setEncoding('utf8');
		r.on('data', function (chunk) {
			console.log("Data: "+chunk);
			output += chunk;
		});
		r.on('end', function() {
			console.log("End: "+output);
			res.json({
				pid: id,
				serviceName: serviceName,
				date: new Date(),
				request: {
					endpoint: endpoint,
					statusCode: r.statusCode,
					response: JSON.parse( output )
				}
			});
		})
	});

	client.on('error', (e) => {
		console.log(`Problem with request: ${e.message}`);
		res.status(500).json({
			pid: id,
			serviceName: serviceName,
			status: e.message,
			endpoint: endpoint
		});
	});

	client.end();
});

app.get('/exit', function (req, res) {
	console.log('Exiting '+serviceName+' with ID: '+id);
	res.json({
		pid: id,
		serviceName: serviceName,
		status: "Ending process"
	});
	process.exit();
});


app.listen(process.env.PORT, function () {
	console.log('Inicialized '+serviceName+' with ID: '+id);
});