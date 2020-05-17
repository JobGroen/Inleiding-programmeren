function dagelijksVerbruik(huidigeLeeftijd, streefLeeftijd, verbruik, prijs){

    var prijsWeek = prijs * 7 * verbruik;
    var overigeJaren = streefLeeftijd - huidigeLeeftijd;
    var wekenInJaar = 52;

    var allesBijElkaar = overigeJaren * prijsWeek * wekenInJaar;

    document.getElementById("uitkomst").textContent = "Als je zo door gaat met je favoriete consumptie ben je in totaal " + allesBijElkaar + " euro kwijt aan sigaretten!";
}


function verwerkFormulier(){
    var huidigeLeeftijd = document.querySelector("input#leeftijd").value;
    var streefLeeftijd = document.querySelector("input#streef").value;
    var verbruik = document.querySelector("input#verbruik").value;
    var prijs = document.querySelector("input#prijs").value;

    dagelijksVerbruik(huidigeLeeftijd, streefLeeftijd, verbruik, prijs);
}

document.querySelector("#submit").addEventListener("click", verwerkFormulier);