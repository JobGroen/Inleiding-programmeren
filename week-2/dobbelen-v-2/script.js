// function werp(){

//     document.querySelector('img').classList.add("throw");
    
//     // var audio = new Audio('sound.mp3');
//     // audio.play();
    
//     var randomGetal = Math.random()*6;
//     var aantalOgen = Math.floor(randomGetal) + 1;
    
//     plaatjesArray = ['dice1.png', 'dice2.png', 'dice3.png','dice4.png', 'dice5.png', 'dice6.png'];
    
//     var dobbelsteenAfbeelding = document.querySelector("img").src="img/dice" + aantalOgen + ".png";
    
//     console.log(aantalOgen);
//     console.log(dobbelsteenAfbeelding);
    
// }

// document.querySelector("img").addEventListener("click", werp);

// function werp
function werp(){

    // class toevoegen
    document.querySelector('img').classList.add("throw");

    // plaatjes array
    plaatjesArray = ['dice1.png', 'dice2.png', 'dice3.png','dice4.png', 'dice5.png', 'dice6.png'];
    
    // random getal genereren 
    var randomGetal = Math.random()*6;

    // random getal afronden
    var aantalOgen = Math.ceil(randomGetal);
    
    // aantal ogen -1 want 6 bestaat niet in de array
    var plaatjesNummer = aantalOgen-1;

    // plaatje is random getal van de random
    var dobbelsteenAfbeelding = plaatjesArray[plaatjesNummer];
    
    // afbeelding linken aan getal
    document.querySelector("img").src = "img/" + dobbelsteenAfbeelding;
}

// werp functie toepassen
document.querySelector("img").addEventListener("click", werp);

