//initialisation du serveur
var express = require('express'), app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var port = 8080;

app.get('/*',express.static(__dirname + '/public'));


class Partie {
constructor(id,plateau, nom, socketBlanc, socketNoir,tour,fini) {
this.id = id;
this.plateau = plateau;
this.nom = nom;
this.socketBlanc = socketBlanc;
this.socketNoir = socketNoir;
this.tour=tour;
this.fini=fini;
}
}

var parties=[];

var current_id=0;


io.on('connection', function(socket){
	
	socket.id=undefined;
	socket.joueur=undefined;
	
	sendParties(socket);
	
	socket.on('createGame',function(nom,fnc){
		fnc(current_id,nom,true,true);
		parties.push(new Partie(current_id,initBoard(),nom,undefined,undefined,1,false));
		current_id++;
		
		sendParties(undefined);//on envoie la nouvelle liste de parties a tous les clients connectés
	});
	
	socket.on('disconnect',function(){
		if (socket.id!=undefined){
			if (socket.joueur==1){
				parties[socket.id].socketBlanc=undefined;
				autreSocket=parties[socket.id].socketNoir;
				if (autreSocket!=undefined){
					autreSocket.emit('pause',true);					
					
				}
			}
			else{
				parties[socket.id].socketNoir=undefined;
				autreSocket=parties[socket.id].socketBlanc;
				if (autreSocket!=undefined){
					autreSocket.emit('pause',true);
				}
			}
			
			sendParties(undefined);//on envoie la nouvelle liste de parties a tous les clients connectés
		}
	});
	
	
	socket.on('joinGame',function(id,joueur){
		socket.id=id;
		socket.joueur=joueur;
		socket.emit('init',joueur,parties[id].tour,JSON.stringify(parties[id].plateau));
		if (joueur==1){
			parties[id].socketBlanc=socket;
			autreSocket=parties[socket.id].socketNoir;
			if (autreSocket!=undefined){
				socket.emit('pause',false);
				autreSocket.emit('pause',false);
			}			
		}
		else{
			parties[id].socketNoir=socket;
			autreSocket=parties[socket.id].socketBlanc;
			if (autreSocket!=undefined){
				socket.emit('pause',false);
				autreSocket.emit('pause',false);
			}
		}
		
		sendParties(undefined);//on envoie la nouvelle liste de parties a tous les clients connectés
		
	});
	
	socket.on('update',function(data, piece){
		board = JSON.parse(data);

		parties[socket.id].plateau=board;
		parties[socket.id].tour = -parties[socket.id].tour;
		
		if (socket.joueur==1){
			parties[socket.id].socketNoir.emit('update',data,piece);
		}
		else{
			parties[socket.id].socketBlanc.emit('update',data,piece);
		}
	});
	
	socket.on('chat',function(message){
		if (socket.joueur==1){
			parties[socket.id].socketNoir.emit('chat',message);
		}
		else{
			parties[socket.id].socketBlanc.emit('chat',message);
		}
	});
	
	socket.on('end',function(data,gagnant){
		if (socket.joueur==1){
			parties[socket.id].socketNoir.emit('end',data,gagnant);
		}
		else{
			parties[socket.id].socketBlanc.emit('end',data,gagnant);
		}
		
		parties[socket.id].fini=true;
		sendParties(undefined);//on envoie la nouvelle liste de parties a tous les clients connectés
	});
	
	socket.on('quitGame',function(){
		if (socket.id!=undefined){
			if (socket.joueur==1){
				parties[socket.id].socketBlanc=undefined;
				autreSocket=parties[socket.id].socketNoir;
				if (autreSocket!=undefined){
					autreSocket.emit('pause',true);					
					
				}
			}
			else{
				parties[socket.id].socketNoir=undefined;
				autreSocket=parties[socket.id].socketBlanc;
				if (autreSocket!=undefined){
					autreSocket.emit('pause',true);
				}
			}
			socket.id=undefined;
			socket.joueur=undefined;
			
			sendParties(undefined);//on envoie la nouvelle liste de parties a tous les clients connectés
		}
	});
});



server.listen(port);

function initBoard(){//initialise le plateau d'échecs
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

function sendParties(socket){//envoie la liste des parties a 1 client (ou si socket==undefined a tous les clients connectés)

			//on cree la liste des parties existantes a envoyer
			let noms=[];//les noms des parties
			let blancLibres=[];//booleens indiquant si la place du joueur blanc est libre
			let noirLibres=[];//booleens indiquant si la place du joueur noir est libre
			let finis=[];//liste indiquant si chaque partie est finie ou non
			for (let i=0;i<current_id;i++){
				noms.push(parties[i].nom);
				blancLibres.push(parties[i].socketBlanc==undefined);
				noirLibres.push(parties[i].socketNoir==undefined);
				finis.push(parties[i].fini);
			}
			
			if (socket==undefined){
				io.sockets.emit('listeParties',JSON.stringify(noms),JSON.stringify(blancLibres),JSON.stringify(noirLibres),JSON.stringify(finis));
			}
			else{
				socket.emit('listeParties',JSON.stringify(noms),JSON.stringify(blancLibres),JSON.stringify(noirLibres),JSON.stringify(finis));
			}
			
};






