// Oppervlakte berekenen maar dan resultaat in html pagina
function berekenOppervlakte(){
    var breedte = document.getElementById("breedte").value;
    var hoogte = document.getElementById("hoogte").value;
    
    var oppervlakte = breedte * hoogte;

    document.getElementById("oppervlakte").value = oppervlakte;

}


// Oppervlakte bereken via console
function oppervlakte(breedte, hoogte){    
    return breedte * hoogte;
}

var totaal = oppervlakte(10, 10);

console.log("De oppervlakte is " + totaal + " cm2.");



// Inhoud bereken van iets
function inhoud(breedte, hoogte, lengte){
    return breedte * hoogte * lengte;
}

var total = inhoud(10,10,10);

console.log("De inhoud is: " + total + " cm3.");



// Omtrek berekenen
function omtrekBerekenen(straal, pie){
    return straal * 2 * pie;
}

var omtrekcirkel = omtrekBerekenen(10, 3.14);

console.log("De omtrek van de cirkel is " + Math.round(omtrekcirkel) + " cm2");


// oppervlakte berekenen
function oppervlakteCirkel(straal, pie){
    return straal * straal * pie;
}

var oppcirkel = oppervlakteCirkel(10, 3.14);

console.log("De oppervlakte van de cirkel is " + Math.round(oppcirkel) + " cm2");


// Inhoud bol berekenen
function bolBerekenen(pie, straal) {
    return 4 / 3 * pie * straal * straal * straal;
}

var balInhoud = bolBerekenen(10, 3.14);

console.log("De inhoud van de bol is " + Math.round(balInhoud) + " cm3");