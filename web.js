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
		var p = rawDescription.match(/(.*) \((.*)\)/);
		var p2 = rawDescription.match(/ ([0-9]*) (.*) ([0-9]*) (.*)/);
		if(p.length == 3 && p2.length == 5) {
			return {game: p[1], status: p[2], score1: p2[1], score2: p2[3]};
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
				var score1 = clean.score1;
				var score2 = clean.score2;
				games.push(
					{
						rank: p[1], 
						description: description, 
						gameId: p[5], 
						status: status, 
						score1: score1, 
						score2: score2 
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

var port = process.env.PORT || 5000;
app.listen(port);
console.log('Listening on port '+port);