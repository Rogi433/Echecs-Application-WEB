//initialisation du serveur
var express = require('express'), app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var port = process.env.PORT || 8080;

app.get('/*',express.static(__dirname + '/public'));


var socketBlanc=undefined;
var socketNoir=undefined;

io.on('connection', function(socket){
	if (socketBlanc==undefined){
		socketBlanc=socket;
		console.log("Blanc connecté");
		
		socketBlanc.emit('init',1,JSON.stringify(board));
		
		socketBlanc.on('disconnect',function(){
			socketBlanc=undefined;
			console.log("blanc deconnecté");
		});
		
		socketBlanc.on('update',function(data){
			board=JSON.parse(data);
			socketNoir.emit('update',data);
		});
		
		socketBlanc.on('chat',function(message){
			socketNoir.emit('chat',message);
		});
		
		socketBlanc.on('end',function(data,gagnant){
			socketNoir.emit('end',data,gagnant);
		});
		
		
		
	}
	else if(socketNoir==undefined){
		socketNoir=socket;
		console.log("Noir connecté");
		
		socketNoir.emit('init',-1,JSON.stringify(board));
		
		socketNoir.on('disconnect',function(){
			socketNoir=undefined;
			console.log("noir déconnecté");
		});
		
		socketNoir.on('update',function(data){
			board=JSON.parse(data);
			socketBlanc.emit('update',data);
		});
		
		socketNoir.on('chat',function(message){
			socketBlanc.emit('chat',message);
		});
		
		socketNoir.on('end',function(data,gagnant){
			socketBlanc.emit('end',data,gagnant);
		});
		
	}
	else{
		socket.emit('err', { message: "Deja deux joueurs connectés" })
		socket.disconnect()
		console.log('Disconnected')
	}
});


server.listen(port);


//initialisation du jeu d'echec
var ligne1=[-5,-4,-3,-2,-1,-3,-4,-5];
var ligne2=[-6,-6,-6,-6,-6,-6,-6,-6];

var board=[ligne1,ligne2];
for (var k=0;k<4;k++){
	let ligne=[0,0,0,0,0,0,0,0];
	board.push(ligne);
}

var newligne1 =[];
var newligne2=[];
for (var k=0;k<8;k++){
	newligne1.push(-ligne1[k]);
	newligne2.push(-ligne2[k]);
}
board.push(newligne2);
board.push(newligne1);









