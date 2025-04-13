const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");  //is tarike se akele chess class nikl skte hn pure m se
const path = require("path"); // to run it on server
const { title } = require("process");
const { log } = require("console");

const app = express(); //creating app instances (this wll do routing parts, middleware etc)
const server = http.createServer(app); // initializing http servers with express

const io = socket(server);  //express and http's servers are linked by socket.io (gives real time connectivity)

const chess = new Chess(); //Chessjs ke sare rules ab chess se chla skte hn 

// variables
let players = {};
let currentPlayer = "W"; // W = white , jo b phla player ayga usko white goti milegi

app.set("view engine", "ejs"); //isse we get to use ejs

app.set("views", path.join(__dirname, "views")); //🧠
app.use(express.static(path.join(__dirname, "public")));   //static files use krskte hn , phots videos fonts , js, css html etc

// routes
app.get("/", (req, res) => {
    res.render("index", { title: "Chess Game💕" });
});


//setting socket io functionalities
io.on("connection", function(uniquesocket){  //jb b koi hmari website se connct hoga uski unique info hme milegi and vo connct hojynge 
    console.log("connected");

    if(!players.white){ //agr white field occupied nhi h to user ko white dedo  (literak meaning  -> kya white naam ki field nhi h - agr nhi h to bna do)
        players.white = uniquesocket.id; // yha uniquesocket us bande ki khudki id h ...and us player ko white field allot ho gyi h
        uniquesocket.emit("playerRole", "w"); //ye event usi user k liye h jo khud connect hua h
    }
    else if(!players.black){ //agr black field p player occupied nhi h already
        players.black = uniquesocket.id; //to usi player ki unique id ko black dedp
        uniquesocket.emit("playerRole", "b"); //backend usi same player ko msg bhej rha h ki sir aapko black goti allot hogyi h
    }
    else{ //b and w dono occupy hogye ab jo b user ayga vo spectator bn jyg
        uniquesocket.emit("spectatorRole");
    }


    uniquesocket.on("disconnect", function(){ //agr koi player diconnct hojta h to us player ki id ko dlt krdo
        if(uniquesocket.id === players.white){
            delete players.white;
        }
        else if(uniquesocket.id === players.black){
            delete players.black;
        }
    });

// jb b ham frontend p koi goti chlenge to ek event throw krnge jo backend ayga, us event ka naam move h
    uniquesocket.on("move", (move)=> { //try catch is imp bcz without it our server will crash
        try{  
                //chess k andr sare rules hn and it can tell kb konki turn h and it has several methods for it like chess.turn()
            if(chess.turn() === "w" && uniquesocket.id !== players.white) return; //agr white ki turn h and white ki jgh black ki goti chlne ki koshish ki to vo return hojyga move and nhi chlega
            if(chess.turn() === "b" && uniquesocket.id !== players.black) return; 
            //eg-> agr white ki turn h aur white time le rha h and tb tk black k kuch chlane ka try kia to vo chlega to mgr turant vps undo hojyga bcz y invalid move h

            const result = chess.move(move); //isse game state update hogi....chess game m elem move hoga is method se ...and result m koi glt move hoga to error aajyga otherwise update hojyga.
            if(result){ //if result is truthy/valid means then update results
                currentPlayer = chess.turn(); //jiska ab turn h chlne ka vo currntplayer m mil jyga 
                io.emit("move", move); //io.emit mtlb ab ham sbhi k ps results bhej rh hn frontend p
                io.emit("boardState", chess.fen()) //fen tells the current state of game, and io.emit kia means ab sb vo b frontend p dekh skte hn
            }
            else{ //agr invalid move h to error show krna h
            console.log("Invalid move : ", move); //move m details hn to pta chl jyga konsa move glt hua h vo
            uniquesocket.emit("InvalidMove", move); //sirf jo user khud error kia h usi ko ye msg dikhega
            }
        }

        catch(err){ //user agr koi esa move chlde jisse engine ki fail hojye then hme try k bd sidha catch milega
            console.log(err);
            uniquesocket.emit("Invalid move : ", move); // us user ko dikhega that they did some invalid move
        }
    })

});


// server.listen(3000, function(){
//     console.log("listening on port 3000");
// });
const port = process.env.PORT || 3000;
server.listen(port, function() {
    console.log(`Listening on port ${port}`);
});