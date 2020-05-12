// Versie 1
// function stoplicht(kleur){
//     if (kleur == "rood"){
//         console.log("Stop uw tesla AUB!");
//     }

//     if (kleur == "groen"){
//         console.log("U kunt doorrijden!");
//     }

//     if (kleur == "oranje"){
//         console.log("Misschien moet u remmen");
//     }
// }

// stoplicht("groen");




// Versie 2
function stoplicht(kleur, afstand){
    if (kleur == "rood"){
        console.log("Stop uw tesla AUB!");
    }

    if (kleur == "groen"){
        console.log("U kunt doorrijden!");
    }

    if (kleur == "oranje" && afstand < 10){
        console.log("Nu kan je nog gassen! Snel!");
    } else {
        console.log("Jammer maatje, remmen!");
    }
}

stoplicht("oranje", 10);