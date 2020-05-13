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

    if (dobbelsteenAfbeelding == plaatjesArray[0] || dobbelsteenAfbeelding == plaatjesArray[2] || dobbelsteenAfbeelding == plaatjesArray[4]){
        document.querySelector("h1").textContent = "Jammer je hebt " + aantalOgen + " gegooid en verloren!";

    }   else if (dobbelsteenAfbeelding == plaatjesArray%2 == 0){
        document.querySelector("h1").textContent = "Gefeliciteerd je hebt even gegooid";

    } else if (dobbelsteenAfbeelding == plaatjesArray[1] || dobbelsteenAfbeelding == plaatjesArray[3]){
        console.log("Gefeliciteerd, nummer " + aantalOgen + "is een win nummer!");

    } else if (dobbelsteenAfbeelding == plaatjesArray[5]){
        console.log("Nummer " + aantalOgen + " is Feest! dubbel uitbetaald!11!!!!");
    }
}

// werp functie toepassen
document.querySelector("img").addEventListener("click", werp);

