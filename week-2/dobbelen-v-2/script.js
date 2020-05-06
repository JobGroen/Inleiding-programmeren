function werp(){

    document.querySelector('img').classList.add("throw");
    
    // var audio = new Audio('sound.mp3');
    // audio.play();
    
    var randomGetal = Math.random()*6;
    var aantalOgen = Math.floor(randomGetal) + 1;
    
    plaatjesArray = ['dice1.png', 'dice2.png', 'dice3.png','dice4.png', 'dice5.png', 'dice6.png'];
    
    var dobbelsteenAfbeelding = document.querySelector("img").src="img/dice" + aantalOgen + ".png";
    
    console.log(aantalOgen);
    console.log(dobbelsteenAfbeelding);
    
}

document.querySelector("img").addEventListener("click", werp);
