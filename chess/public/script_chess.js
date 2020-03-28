var board=[];


socket.on('init',function(couleur,turn,data){
	joueur=couleur;
	if(joueur==1){
		indication_joueur.textContent="Blanc";
		board=JSON.parse(data);
	}
	else{
		indication_joueur.textContent="Noir";
		board=convert(JSON.parse(data));
	}
	if (turn==joueur){
		your_turn=true;
	}
	else{
		your_turn=false;
	}
	pause=true;
	info_tour.textContent="En pause tant qu'il n'y a pas deux joueur connectés à la partie...";
	
	chatContent.innerHTML="";
	
	update();
});

socket.on('pause',function(bool){
	pause=bool;
	
	if (!fini){
		
		if (pause){
			info_tour.textContent="En pause tant qu'il n'y a pas deux joueur connectés à la partie...";
		}
		else{
			if (your_turn){
				info_tour.textContent="A vous de jouer !";
			}
			else{
				info_tour.textContent="En attente de l'autre joueur...";
			}
		}
	}
});

socket.on('update',function(data){
	if(joueur==1){
		board=JSON.parse(data);
	}
	else{
		board=convert(JSON.parse(data));
	}
	update();
	
	if (reste_coup_possible()){
		your_turn=true;
		info_tour.textContent="A vous de jouer !";
	}
	else if (is_check(joueur)){
			socket.emit('end',data,-joueur);
			fin_partie(-joueur);
		}
		else {
			socket.emit('end',data,0);
			fin_partie(0);
		}
});

retour.addEventListener('click', function(){
	socket.emit('quitGame');
	
	page_accueil.style.display="block";
	page_jeu.style.display="none";
});

messageText.addEventListener('keyup', function(event) {
    event.preventDefault();
    if (event.keyCode === 13) {
        boutonEnvoi.click();
    }
});

boutonEnvoi.addEventListener('click',function(){
	if(!pause){
		let message=messageText.value;
		if (message!=""){
			messageText.value="";
			socket.emit('chat',message);
			ecrit(message,true);
		}
	}
});

socket.on('chat',function(message){
	ecrit(message,false);
});

socket.on('end',function(data,gagnant){
	if(joueur==1){
		board=JSON.parse(data);
	}
	else{
		board=convert(JSON.parse(data));
	}
	update();
	fin_partie(gagnant);
	
});


function fin_partie(gagnant){
	fini=true;
	if (gagnant==joueur) info_tour.textContent="Partie finie : vous avez gagné !";
	else if(gagnant==-joueur) info_tour.textContent="Partie finie : vous avez perdu !";
	else info_tour.textContent="Partie finie : égalité (par Pat) !";
	}


//construction de la table correspondant a l'echiquier
var table=[];

for (let k=0;k<8;k++)
{

	
	let ligne=document.createElement("tr");
	let liste=[];
	
	for (let l=0;l<8;l++){
	
		let cell=document.createElement("td");
		if ((k+l)%2==1) cell.style.backgroundColor="rgb(255,200,160)";
		else cell.style.backgroundColor="white";
		
		cell.style.width="3vw";
		cell.style.height="3vw";
		
		
		cell.addEventListener('click',function(){selectCell(k,l)});
		
		ligne.appendChild(cell);
		liste.push(cell);
	}
	
	
	table.push(liste);
	
	echiquier.appendChild(ligne);
}


var current=undefined; //pour la selection de case cliquée

//construction de la zone de selection dans le cas de promotion de pion (au depart invisible)
for (let l=2;l<6;l++){
	
	let cell=document.createElement("td");
	
	img=document.createElement("img");
	img.src="images/"+l+".png";
	img.style.width="4vw";
	img.style.height="4vw";
	
	img.addEventListener('click',function(){choosePromotion(l)});
	
	br=document.createElement("br");
	
	//image='url("images/'+l+'.png")';
	//cell.style.backgroundImage=image;	
	//ligne_promotion.appendChild(cell);
	
	promotion.appendChild(img);
	//promotion.appendChild(br);
}
promotion.style.display="none";

var promotionSquare; //used when a promotion is being choosed

//partie de gestion du jeu

var joueur;//d'abord les blancs, vaudrait -1 pendant le tour des noirs
var your_turn=false;
var pause=true;
var fini=false;

var roqueGauchePossible=true;
var roqueDroitPossible=true;

const K=1; //pour rendre plus clair l'utilisation des codes avec par exemple K ou -K au lieu de 1 ou -1 pour un roi
const Q=2;
const B=3;
const N=4;
const R=5;
const P=6;

function promote(){
	promotion.style.display="block";
}

function ecrit(message,soiMeme){
	let texte = document.createElement("div");
	texte.textContent=message;
	if (soiMeme){
		texte.style.textAlign="right";
		texte.style.color="blue";
	}
	else{
		texte.style.textAlign="left";
		texte.style.color="red";
	}
	let hr = document.createElement("hr");
	chatContent.appendChild(texte);
	chatContent.appendChild(hr);
	chatContent.scrollTop = chatContent.scrollHeight;
}

function convert(old_board){//convertit de la vue du noir a celle du blanc et vice versa
	let new_board=[];
	for (let k=0;k<8;k++){
		new_board.push(new Array(8));
	}
	
	for (let k=0;k<8;k++){
			for (let l=0;l<8;l++){
				new_board[7-k][7-l]=old_board[k][l];
			}
		}
	return new_board;

}

function selectCell(k,l){
	
	if (your_turn && !pause && !fini){
		if (current==undefined){
			current=[k,l];
			cell=table[k][l];
			cell.style.backgroundColor="green";
		}
		else{
			let x=current[0];
			let y=current[1];
			current=undefined;
			cell=table[x][y];
			if ((x+y)%2==1) cell.style.backgroundColor="rgb(255,200,160)";
			else cell.style.backgroundColor="white";
			
			
			
			if (coup_ok([x,y],[k,l])){
				
				//déplacement de la piece ayant bougé
				board[k][l]=board[x][y];
				board[x][y]=0;
				
				if (Math.abs(board[k][l])==K && l==y-2){//si roque gauche on doit aussi déplacer la tour gauche
					board[k][y-1]=board[k][0];
					board[k][0]=0;
				}
				
				if (Math.abs(board[k][l])==K && l==y+2){//si roque droit on doit aussi déplacer la tour droite
					board[k][y+1]=board[k][7];
					board[k][7]=0;
				}
				
				update();
				
				
				//puis prise en compte des conséquences du déplacement
				if (Math.abs(board[k][l])==K){
					roqueGauchePossible=false; //le roi a bougé donc roque plus possible
					roqueDroitPossible=false;
				}
				if (Math.abs(board[k][l])==R && y==0){
					roqueGauchePossible=false; //la tour gauche n'est pas resté tout le temps a sa position initiale donc roque gauche plus possible
				}
				if (Math.abs(board[k][l])==R && y==7){
					roqueDroitPossible=false; //la tour droite n'est pas resté tout le temps a sa position initiale donc roque droit plus possible
				}
				
				
				if (k==0 && Math.abs(board[k][l])==P){//promotion
					promotion.style.display="block";
					promotionSquare=[k,l];
				}
				else{
				
					endTurn();
				
				}
				
				
			}
		}
	}
}

function update(){
	for (var k=0;k<8;k++){
		for (var l=0;l<8;l++){
		
			let piece=board[k][l];			
			let cell=table[k][l];
			if (piece!=0){
				image='url("images/'+piece+'.png")';
				cell.style.backgroundImage=image;
			}
			else{
				cell.style.backgroundImage="none";
			}
		}
	}
}

function deplacement_ok(camp,start,end){
	let x1=start[0];
	let y1=start[1];
	let x2=end[0];
	let y2=end[1];
	
	let piece1=board[x1][y1];
	let piece2=board[x2][y2];
	
	if (camp*piece1<=0){ 
		return false //si la case de depart est vide ou contient une piece de l'equipe qui ne joue pas
	}
	
	if (camp*piece2>0){ 
		return false //si la case de fin contient une piece de l'equipe qui joue
	}
	
	if (Math.abs(piece1)==P){ //cas du pion
		if (piece2==0 && y2==y1 && x2==x1-1){ //le pion doit toujours avancer vers le haut (puisque on affiche les pieces du joueur en bas et de l'ennemi en haut dans tous les cas)
			return true; //avancee normale d'une case
		}
		if (piece2==0 && y2==y1 && x1==6 && x2==x1-2){ 
			return true; //avancee de deux cases pour un pion au debut
		}
		if (piece2*piece1<0 && Math.abs(y2-y1)==1 && x2==x1-1){
			return true; //prise d'une piece ennemie
		}
		
		
	}
	
	if (Math.abs(piece1)==R){//cas de la tour
		if (y2==y1){ //déplacement vertical
			for (let x=Math.min(x1,x2)+1;x<Math.max(x1,x2);x++){ //pour vérifier que les cases intermediaires sont vides
				if (board[x][y1]!=0) return false;
			}
			return true;
		}
		if (x2==x1){ //déplacement horizontal
			for (let y=Math.min(y1,y2)+1;y<Math.max(y1,y2);y++){ //pour vérifier que les cases intermediaires sont vides
				if (board[x1][y]!=0) return false;
			}
			return true;
		}
	}
	
	if (Math.abs(piece1)==N){//cas du cheval
		if ((Math.abs(x1-x2)==2 && Math.abs(y1-y2)==1) || (Math.abs(x1-x2)==1 && Math.abs(y1-y2)==2)){//verification de 1 case dans un sens et 2 dans l'autre
			return true; //pas besoin de verifier des cases intermediaires ici
		}
	}
	
	if (Math.abs(piece1)==B){//cas du fou
		if (Math.abs(x1-x2)==Math.abs(y1-y2)){ //verification que le deplacement est diagonal
			for (let n=1;n<Math.abs(x1-x2);n++) { //pour vérifier que les cases intermediaires sont vides
				let x=x1+n*(x2-x1)/Math.abs(x2-x1);
				let y=y1+n*(y2-y1)/Math.abs(y2-y1);
				if (board[x][y]!=0) return false;
			}
			return true;			
		}
		
	}
	
	if (Math.abs(piece1)==Q){//cas de la reine (on reprend les parties de code du fou et de la tour)
	
		if (y2==y1){ //déplacement vertical
			for (let x=Math.min(x1,x2)+1;x<Math.max(x1,x2);x++){ //pour vérifier que les cases intermediaires sont vides
				if (board[x][y1]!=0) return false;
			}
			return true;
		}
		if (x2==x1){ //déplacement horizontal
			for (let y=Math.min(y1,y2)+1;y<Math.max(y1,y2);y++){ //pour vérifier que les cases intermediaires sont vides
				if (board[x1][y]!=0) return false;
			}
			return true;
		}
		
		if (Math.abs(x1-x2)==Math.abs(y1-y2)){ //verification que le deplacement est diagonal
			for (let n=1;n<Math.abs(x1-x2);n++) { //pour vérifier que les cases intermediaires sont vides
				let x=x1+n*(x2-x1)/Math.abs(x2-x1);
				let y=y1+n*(y2-y1)/Math.abs(y2-y1);
				if (board[x][y]!=0) return false;
			}
			return true;			
		}
		
	}
	
	if (Math.abs(piece1)==K){//cas du roi
		if ((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1)<=2){//mouvement normal, le roque est verifie dans coup_ok
			return true;
		}
	}
	
	
	
	return false;

}

function reste_coup_possible(){ //verifie si il reste au moins un coup possible pour "joueur"
	
	for (let x1=0;x1<8;x1++){
		for (let y1=0;y1<8;y1++) {
		
			if (board[x1][y1]*joueur>0) {//piece de la bonne couleur
			
				for (let x2=0;x2<8;x2++){
					for (let y2=0;y2<8;y2++) {
						if (coup_ok([x1,y1],[x2,y2])) return true;				
					}
				}
			
			}
		
		
		}
	}
	
	return false;
}

function is_check(camp){ //verifie si il y a un echec menacant camp (camp = 1 pour le blanc ou -1 pour le noir)

	for (let x2=0;x2<8;x2++){
		for (let y2=0;y2<8;y2++) {
		
			if (board[x2][y2]==camp*K) {//roi de la bonne couleur
			
				for (let x1=0;x1<8;x1++){
					for (let y1=0;y1<8;y1++) {
						if (deplacement_ok(-camp,[x1,y1],[x2,y2])) return true;				
					}
				}
			
			}
		
		
		}
	}
	
	return false;	
}

function coup_ok(start,end){ //verifie que ce coup est ok pour "joueur"

	let x1=start[0];
	let y1=start[1];
	let x2=end[0];
	let y2=end[1];
	
	let piece1=board[x1][y1];
	let piece2=board[x2][y2];
	
	if (deplacement_ok(joueur,start,end)){
		
		board[x2][y2]=piece1;
		board[x1][y1]=0;
		
		let check=is_check(joueur);
		board[x1][y1]=piece1;
		board[x2][y2]=piece2;
		
		if (!check) return true;
			
		}

	if (Math.abs(piece1)==K && x1==7 && x1==x2){//deplacement_ok verifie seulement les deplacements standards donc on verifie aussi le cas du roque
	
		if (y2-y1==-2 &&  roqueGauchePossible){//roque gauche
		
			let espace_libre = true; //verifie que l'espace entre tour et roi est libre
			for (let y=1;y<y1;y++){
				if (board[x1][y]!=0) espace_libre = false;
			}
			
			let espace_non_menace = true; //verifie que les cases que le roi va traverser (y compris celle ou il commence et celle ou il finit) sont non menacées 
			for (let y=y1; y>=y2; y--){
				let piece_case=board[x1][y];
				board[x1][y]=K*joueur;
				if (is_check(joueur)) espace_non_menace = false;
				board[x1][y]=piece_case;
			}
			
			if (espace_libre && espace_non_menace) return true;
			
		}
		if (y2-y1==2 &&  roqueDroitPossible){//roque droit
		
			let espace_libre = true; //verifie que l'espace entre tour et roi est libre
			for (let y=6;y>y1;y--){
				if (board[x1][y]!=0) espace_libre = false;
			}
			
			let espace_non_menace = true; //verifie que les cases que le roi va traverser (y compris celle ou il commence et celle ou il finit) sont non menacées 
			for (let y=y1; y<=y2; y++){
				let piece_case=board[x1][y];
				board[x1][y]=K*joueur;
				if (is_check(joueur)) espace_non_menace = false;
				board[x1][y]=piece_case;
			}
			
			if (espace_libre && espace_non_menace) return true;
		
		}
	}
		
	return false;	
}

function choosePromotion(piece){
	x=promotionSquare[0];
	y=promotionSquare[1];
	
	board[x][y]=joueur*piece;
	update();
	
	promotion.style.display="none";
	
	endTurn();
}

function endTurn(){
	let data;
	if(joueur==1){
		data=JSON.stringify(board);
	}
	else{
		data=JSON.stringify(convert(board));
	}

	if(joueur==1){
		socket.emit('update',data);
	}
	else{
		socket.emit('update',data);
	}
					
	your_turn=false;
	info_tour.textContent="En atttente de l'autre joueur...";
					
					
	
}