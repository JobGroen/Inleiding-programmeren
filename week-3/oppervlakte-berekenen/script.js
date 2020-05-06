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