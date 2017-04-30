const express = require('express');
const http = require('http');
const url = require('url');
const app = express();
const crypto = require('crypto');

let id = Math.random().toString(36).substr(2, 9);
let serviceName = process.env.SERVICE_NAME;
let isHealth = true;

app.get('/', function (req, res) {
	res.json({
		pid: id,
		serviceName: serviceName,
		date: new Date()
	});
});

app.get('/fail', function (req, res) {
	res.status(500).json({status: "I'm a failure"});
});

app.get('/success', function (req, res) {
	res.status(200).json({status: "I'm a success"});
});

app.get('/health', function (req, res) {
	res.status(isHealth ? 200 : 500).json({status: "I'm "+(isHealth ? "" : "not ")+"healthy"});
});

app.get('/health/disable', function (req, res) {
	isHealth = false;
	res.json({status: "Service is now unhealthy"});
});

app.get('/health/enable', function (req, res) {
	isHealth = true;
	res.json({status: "Service is now healthy"});
});

app.get('/health/timeout/:seconds', function (req, res) {
	isHealth = false;
	setTimeout(function(){ isHealth = true; }, 1000*req.param('seconds'));
	res.json({status: "Service is now unhealthy", timeout: req.param('seconds')});
});

app.get('/highload/:seconds', function (req, res) {
	let interval = setInterval(function(){
		for(let i = 0; i<100000; i++) {
			const hash = crypto.createHash( 'sha256' );
			hash.update( Math.random().toString( 36 ) );
			hash.digest( 'hex' );
		}
	}, 0);
	setTimeout(function(){ clearInterval(interval);  }, 1000*req.param('seconds'));
	res.json({status: "Service is set to use all CPU available", timeout: req.param('seconds')});
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
		console.log(`problem with request: ${e.message}`);
		res.status(500).json({status: e.message, endpoint: endpoint});
	});

	client.end();
});

app.get('/exit', function (req, res) {
	res.json({status: "Ending process"});
	process.exit();
});


app.listen(process.env.PORT, function () {
	console.log('Inicialized '+serviceName+' with ID: '+id);
});