// De reden waarom je geen ceil gebruikt maar floor is dat floor afrond naar beneden.. stel je hebt 6.05 wil je niet
// hij naar 7 afrond, want een dobbelsteen heeft geen 7 ogen, maar 6.

// Je genereert een getal tussen 0 en 6
var randomGetal = Math.random()*6;

// Variable for aantal ogen, omdat je geen 0 op een dobbelstene hebt doe je bij math.floor + 1 
var aantalOgen = Math.floor(randomGetal) + 1;

// Stap 3
plaatjesArray = ['dice1.png', 'dice2.png', 'dice3.png','dice4.png', 'dice5.png', 'dice6.png'];

// Stap 4 + Stap 5
var dobbelsteenAfbeelding = document.querySelector("img").src="img/dice" + aantalOgen + ".png";



console.log(aantalOgen);
console.log(dobbelsteenAfbeelding);
