function dagelijksVerbruik(huidigeLeeftijd, streefLeeftijd, favorieteConsumptie, verbruik, prijs){

    document.querySelector('p').textContent = huidigeLeeftijd + ", "  + streefLeeftijd + ", "  + favorieteConsumptie + ", "  + verbruik + ", " + prijs;

    var prijsWeek = prijs * 7;
    var overigeJaren = streefLeeftijd - huidigeLeeftijd;
    var wekenInJaar = 52;

    var allesBijElkaar = overigeJaren * prijsWeek * wekenInJaar;

    document.getElementById("uitkomst").textContent = "Als je zo door gaat met je favoriete consumptie ben je in totaal " + allesBijElkaar + " euro kwijt aan sigaretten!";
}

dagelijksVerbruik(21, 100, "sigaretten", 1, 7);