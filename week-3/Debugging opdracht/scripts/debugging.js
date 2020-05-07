/*jslint browser: true, devel: true, eqeq: true, plusplus: true, sloppy: true, vars: true, white: true*/
/*eslint-env browser*/
/*eslint 'no-console':0*/

/* Copyleft        */
/* D. de Vries    */
/* Week 3       */


//Dit script begroet mijn collega's en toont dit in de browser!

//array collega's
var collegas = ('Walter', 'Laura', 'Sonja');
var content = document.querySelectorAll('body')[0];



//deze functie begroet mijn collega's
function groet(persoon) {
    var naam = persoon.toLowerCase();
    var printTekst = 'Hallo' + naam
    content.textContent = content.textContent + printTekst;
}

//hier roep ik drie keer de functie aan
groet(collegas[1]);
groet(collegas[2]);
groet(collegas[3]);




// DIT IS GEDEBUGGED

//array collega's
var collegas = ['Walter', 'Laura', 'Sonja'];
var content = document.querySelectorAll('p')[0];



//deze functie begroet mijn collega's
function greeting(persons){
    var name = persons;
    var print = " Hallo " + name;

    content.textContent = print;
}

//hier roep ik drie keer de functie aan
greeting(collegas[0] + ", " + collegas[1] + " en " +  collegas[2]);