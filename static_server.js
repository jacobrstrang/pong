var http = require('http'),
	url = require('url'),
	path = require('path'),
	mime = require('mime'),
	path = require('path'),
	io = require('socket.io'),
	fs = require('fs');
 
// Make a simple fileserver for all of our static content.
// Everything underneath <STATIC DIRECTORY NAME> will be served.
var app = http.createServer(function(req, resp){
	var filename = path.join(__dirname, "static", url.parse(req.url).pathname);
	(fs.exists || path.exists)(filename, function(exists){
		if (exists) {
			fs.readFile(filename, function(err, data){
				if (err) {
					// File exists but is not readable (permissions issue?)
					resp.writeHead(500, {
						"Content-Type": "text/plain"
					});
					resp.write("Internal server error: could not read file");
					resp.end();
					return;
				}
 
				// File exists and is readable
				var mimetype = mime.lookup(filename);
				resp.writeHead(200, {
					"Content-Type": mimetype
				});
				resp.write(data);
				resp.end();
				return;
			});
		}else{
			// File does not exist
			resp.writeHead(404, {
				"Content-Type": "text/plain"
			});
			resp.write("Requested file not found: "+filename);
			resp.end();
			return;
		}
	});
});
app.listen(3456);
var users = new Array();
var matches = new Array();
io.listen(app).sockets.on("connection", function(socket){
	// This closure runs when a new Socket.IO connection is established.
 	var playerid = "default";
	// Listen for client messaging server:
	socket.on("newConnect", function(content){
		console.log("New User with name: "+content);
		
		users.push(content);
		socket.broadcast.emit("newPerson", users);
		socket.emit("newPerson", users);
		playerid=content;
	});
	socket.on("disconnect", function() {
		var index = users.indexOf(playerid);
		if (index > -1) {
			users.splice(index,1);
		}
		socket.broadcast.emit("newPerson",users);
		socket.emit("newPerson",users);
	});
	socket.on("sendID", function(content){
		socket.join(content);
	});
	socket.on("requestGame", function(content){
		socket.broadcast.to(content).emit("passRequest", playerid);
	});
	socket.on("startGame", function(content){
		socket.broadcast.to(content).emit("clientStart", content);
		matches[playerid]=content;
		matches[content]=playerid;
		var ind1 = users.indexOf(playerid);
		if (ind1 > -1) {
			users.splice(ind1, 1);
		}
		var ind1 = users.indexOf(content);
		if(ind1 > -1) {
			users.splice(ind1,1);
		}
		socket.broadcast.emit("newPerson",users);
		socket.emit("newPerson",users);
	});
	socket.on("launch", function(content){
		socket.broadcast.to(matches[playerid]).emit("generateStart",content);
	});
	socket.on("end", function(content){
		users.push(content);
		socket.broadcast.emit("newPerson",users);
		socket.emit("newPerson",users);
	});
	socket.on("launchNoInit", function(content){
		socket.broadcast.to(matches[playerid]).emit("launchNoInit",content);
	});
	socket.on("reflect", function(content){
		socket.broadcast.to(matches[playerid]).emit("reflect",content);
	});
	socket.on("pmove", function(content){
		socket.broadcast.to(matches[playerid]).emit("pmove",content);
	});
	socket.on("raiseOpScore", function(content){
		socket.broadcast.to(matches[content.player]).emit("raiseScore", {});
	});
});
