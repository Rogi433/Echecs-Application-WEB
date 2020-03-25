//initialisation du serveur
var express = require('express'), app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var port = process.env.PORT || 8080;

app.get('/*',express.static(__dirname + '/public'));

var plateaux=[];
var noms=[];
var socketsBlanc=[];
var socketsNoir=[];

var current_id=0;

var socketBlanc=undefined;
var socketNoir=undefined;

io.on('connection', function(socket){
	
	socket.emit('listeParties',JSON.stringify(noms));
	
	socket.on('createGame',function(nom,fnc){
		fnc(current_id,nom);
		plateaux.push(initBoard());
		noms.push(nom);
		socketsBlanc.push(undefined);
		socketsNoir.push(undefined);
		current_id++;
	});
	
	socket.on('joinGame',function(id,joueur){
		console.log("join");
		socket.id=id;
		socket.joueur=joueur;
		socket.emit('init',joueur,JSON.stringify(plateaux[id]));
		if (joueur==1){
			socketsBlanc[id]=socket;
			
		}
		else{
			socketsNoir[id]=socket;
		}
		
		console.log("connecté");
		
		
		socket.on('disconnect',function(){
			console.log("Déconnecté");
		});
		
		socket.on('update',function(data){
			board=JSON.parse(data);
			
			if (socket.joueur==1){
				socketsNoir[socket.id].emit('update',data);
			}
			else{
				socketsBlanc[socket.id].emit('update',data);
			}
		});
		
		socket.on('chat',function(message){
			if (socket.joueur==1){
				socketsNoir[socket.id].emit('chat',message);
			}
			else{
				socketsBlanc[socket.id].emit('chat',message);
			}
		});
		
		socket.on('end',function(data,gagnant){
			if (socket.joueur==1){
				socketsNoir[socket.id].emit('end',data,gagnant);
			}
			else{
				socketsBlanc[socket.id].emit('end',data,gagnant);
			}
		});
	});
	/*
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
			console.log("endblanc");
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
	*/
});



server.listen(port);

function initBoard(){
	let board;
	//initialisation du jeu d'echec
	let ligne1=[-5,-4,-3,-2,-1,-3,-4,-5];
	let ligne2=[-6,-6,-6,-6,-6,-6,-6,-6];

	board=[ligne1,ligne2];
	for (let k=0;k<4;k++){
		let ligne=[0,0,0,0,0,0,0,0];
		board.push(ligne);
	}

	let newligne1 =[];
	let newligne2=[];
	for (let k=0;k<8;k++){
		newligne1.push(-ligne1[k]);
		newligne2.push(-ligne2[k]);
	}
	board.push(newligne2);
	board.push(newligne1);
	
	return board
}








