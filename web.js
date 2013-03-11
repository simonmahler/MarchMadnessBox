var express = require('express');
var http = require('http');
var app = express();
var fs = require('fs');

app.use("/js", express.static(__dirname + '/js'));

app.get('/', function (req, res) {
    res.writeHead(200, { 'Content-type': 'text/html' });
    res.end(fs.readFileSync(__dirname + '/index.html'));
});

app.get('/games', function(req, res){
	//take care of Chrome's double request
	if(req.url == '/favicon.ico') return;

	var options = { host: 'sports.espn.go.com', port: 80, path: '/ncb/bottomline/scores' };

	var cleanup = function(rawText){ return rawText.replace(/%20/g, ' ').replace('^', ''); };
	var parseDescription = function(rawDescription){
		var p = rawDescription.match(/(.*)\((.*)\)/);
		if(p.length == 3) {
			return {game: p[1], status: p[2]};
		} else {
			return {game: '', status: ''};
		}
	};
	var parse = function(chunk){
		var lines = chunk.split('ncb_s_left');
		var games = [];
		for(var i=0; i<lines.length; i++){
			var p = lines[i].match(/([0-9]*)=((.*)\))&(.*)gameId=([0-9]*)(.*)/);
			if(p!= null && p.length == 7){
				var clean = parseDescription(cleanup(p[2]));
				var description = clean.game;
				var status = clean.status;
				games.push(
					{
						rank: p[1], 
						description: description, 
						gameId: p[5], 
						status: status, 
						score1: 12, 
						score2: 25 
					});
			}
		}
		return {
			n: lines.length,
			games: games,
			timestamp: (new Date()).getTime().toString()
		};
	};

	http.get(options, function(r) {
		console.log("Got response: " + r.statusCode);
  		r.on('data', function (chunk) {
    		data = parse(chunk.toString());
    		res.send(data);
  		});
	}).on('error', function(e) {
 		console.log("Got error: " + e.message);
	});
});


app.listen(3000);
console.log('Listening on port 3000');