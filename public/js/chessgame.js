// making the frontend of the chessgame

const socket = io(); //jese hi website load hogi, js run hogi, js chlegi to ye line run hogi dono ke front end p. and automatically hmare device se ek req chli jygi backend p (now reciver and sender ka backend same hi h to dono k backend pe req gyi)  and ye backend pe io.on("connection", function (uniquesocket)) ke ps jygi
// ab mera frontend jo 2 alg alg devices pe chl rha h vo connected h server se real time p  */

const chess = new Chess(); //chess ka engine require krlia
const boardElement = document.querySelector(".chessboard");

//variables:-
let draggedPiece = null; // sari values starting m null h bcz starting state jb game start hota h tb sb null rhta h fir server roles deta h sbko like player role white h ya black etc 
let sourceSquare = null; //means kaha se vo piece uthaya ja rha h(initial position)
let playerRole = null;

// functions for client side:-
const renderBoard = () => {
    const board = chess.board(); //imaginary board of chess, its also a method in chess engine (isse board k sare dimensins, columns , rows, konsa piece kaha bethta h sb details aagyi h board variable m)
    boardElement.innerHTML = ""; //initially board elem should be empty as every time the game starts , it should be empty. (phle khela hua sb khali krdega)
    // console.log(board); board m sare elems ek 2d array k form m arranged hn rows and columns k form m. 8rows and 8col , also middle 4 rows are empty

    board.forEach((row, rowindex) => {
    row.forEach((square, squareindex) => { //column = square and square index = column index
        // console.log(square, squareindex) //hme rows and column ke saare elems mil gye foreach lga k bcz chess ka board ek 2d array k form m arrnged h and ros and column p foreach lga k hame unke sare pieces/elem mil jynge

       const squareElement = document.createElement("div"); // ye jo pieces/ elem hme mile, ab inko rkhne k liye ham squares create kr rh hn ...mtlb inki place bna rhe hn eg: black and white square boxes
       squareElement.classList.add("square", //(here square = css m jo class dete hn vo, and class ka naam square h)hmne jo square elem bnaye hn unko classes de di... and usko ham css m jke kbhi b chng krskte hn
        (rowindex + squareindex) %2 === 0 ? "light" : "dark" //agr ans = 0 then us elem ko light squaremil jyga otherwise dark (light and dark b classes hn)
       );

       squareElement.dataset.row = rowindex; //ise hr square ko hm ek vlaue de rh hn jo ki h uski row and col index
       squareElement.dataset.col = squareindex; //and ye value ham dataset k andr store krwa rhe hn

       if(square){ //agr square null ni h means usme koi piece rkha h to ham ek piece develop krnge
        const pieceElement = document.createElement("div"); //vo piece elem mtlb sare black and white pieces create krnge
        pieceElement.classList.add("piece", //upr side sare white pieces hote hn and niche black ...un pieces ko ab white and black color milega
            square.color === 'w' ? "white" : "black"); //sqare ka color agr w h to use white class milegi otherwise black...yha se hmare piece elem bnke ready hogye hn

            pieceElement.innerText = getPieceUnicode(square) ; // ab un square ke andr vo pieces rkhte hn means hathi ghoda vo ham nikalenge getPieceUnicode ke through
            pieceElement.draggable = playerRole === square.color; // agr playerRole means player jis color se khle rha h vo white h and square color means goti/piece black h to vo player us black goti ko drag nhi kr skta h
            // agr playerRole and square color dono same color h eg white then vo player us piece ko drag kr skta h
           
            pieceElement.addEventListener("dragstart", (e) => { //ab jb us pieceElemt ko drag krnge means koi event lgayenge to dragstart event lgega bcz use drag krna shuru kia h
              if (pieceElement.draggable){ //agr jis piece ko drag kia h vo draggacle h then
                draggedPiece = pieceElement; //us dragged elem ko piece elem k equal krdenge mtlb jisko drag kr rhe hn usme piecelem ko save krdia
                sourceSquare = {row : rowindex, col: squareindex}; //source mtlb kis row and col se hmne use chla h / chlna start kia h
                e.dataTransfer.setData("text/plain", ""); //its recommended to pass a event whenever we use drag elem , so that we dont face any problem while dragging lems at cross-browser
              }  

            });
            pieceElement.addEventListener("dragend", (e) => { //piece jb drag hona end hojye means vo apni new/end position p pohoch gya h drag hoke
                draggedPiece = null; //ab koi piece current m drag ni ho rha h thats why its value is now null. bcz piece already drag hochuka h
                sourceSquare = null; //source square ko b null krdenge bcz next time jb drag ho tb isko vps se set krpye

            });
            
            squareElement.appendChild(pieceElement); //ab hmne square p new piece element attach krdia h drag krne k bd
       }

       squareElement.addEventListener("dragover", function (e){ //jb aapki turn ni h means aap drag kr chuke ho apna piece to vo "dragover event ho jyga"
        e.preventDefault(); // and us case m aap bemtlb koi piece na chl pao isliy use prevent krdia h
       });

       squareElement.addEventListener("drop", function(e){ //jb hm koi piece utha kr use koi square pr rkhne ki koshish kr rhe hn
        e.preventDefault(); //then uska basic nature ham prevent/stop krdenge
        if(draggedPiece){ //ab agr koi piece drag horha h toh, hm hmare piece k liye target source nikalenge
            const targetSource = {
                row: parseInt(squareElement.dataset.row), //jb hmne dataset m inki value dli to vo string bn gyi, isliy isko vps number m convert krne k liye parseInt use kia
                col: parseInt(squareElement.dataset.col)
            };

            handleMove(sourceSquare, targetSource); //ab ye draggedPiece jha b ja rha h use hm yha handle krnge like source se target square p phocha denge
        }
       });
       boardElement.appendChild(squareElement); //ab ham board k andr sare square ko append krdenge, isse hmara chessboard frontend p dikhne lgega/ hmara board render hogya h
    });

    });

    if(playerRole === "b"){ //its to flip the board ...agr player black h then board p class lga denge flipped
        boardElement.classList.add("flipped");
    }
    else{
        boardElement.classList.remove("flipped"); //agr class already lgi hui h then use remove krdenge
    }
};

const handleMove = (source, target) => {
    const move = { //move is an obj that handles 3 things for piece
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}` , //kaha se dragged piece chla:souce
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}` , //and kaha vo pohoch gya:target
        promotion: 'q' // jb pawn last m pohoch jta h then uska promotion hm by default queen m kra rhe hn
    };

    socket.emit("move", move); //backend p vo move emit/bhejna krna pdega tbhi elems move hote hue dikhenge
};

const getPieceUnicode = (piece) => { //isse decide hoga ki hmare pieces ki shkl kesi hogi or vo kese dikhne m honge
    const unicodePieces = {
        p: "♙",
        r: "♖",
        n: "♘",
        b: "♗",
        q: "♕",
        k: "♔",

        P: "♟",
        R: "♜",
        N: "♞",
        B: "♝",
        Q: "♛",
        K: "♚",
    };

    return unicodePieces[piece.type] || ""; //jb hamse unicode mngega to ham unicodepieces jo ki ek object h usme se vo piece available hua to backend p se vo piece chla jyga otherwise blank ya fir kuch b nhi dikhega
}; 

socket.on("playerRole", function (role){
    playerRole = role; //by default , starting m player role mere role k barabar hoga and board render hojyga
    renderBoard();
});

socket.on("spectatorRole", function() {
    playerRole = null; //jb user sirf game dekhne aya h to fir baord render hoga bcz game m uska koi role ni h
    renderBoard();
});

socket.on("boardState", function (fen) { //board ki jo b new state hme recieve hogi tb ham load method ki help se puri fen equation load/receive kr skte hn
    chess.load(fen) //we have a load method in chess which loads the new state
    renderBoard();
});

socket.on("move", function (move) { // jo b move hoga vo ab receive krnge and game m chla denge and board again render krlenge
    chess.move(move);
    renderBoard();
});


renderBoard()