// ---------- Les 1B. 1 ---------- 

// console log om iets te testen in de console
console.log('Hello World!');

// bepaalde tekst toevoegen aan een bepaalde query
document.querySelector('h1').textContent = 'Hello World!';

// een vraag stellen via de prompt en met resultaat tekst in query
document.querySelector('h1').textContent = 'Hello '+prompt('Hoe heet jij?');


// ---------- Les 1B. 2 ---------- 

// Functie gemaakt voor het renderen van een input in een form
function renderForm(e){

    // e.preventdefault zorgt er voor dat de pagina niet herlaadt 
    e.preventDefault();

    // Hier log je in de console wat je hebt in getyped in het formulier
    console.log(document.querySelector('input').value);

    // je plaatst de ingevoerde data in een query met de class les2b of iets dergelijks
    document.querySelector('form').classList.add("trigger_form_animation");
    document.querySelector('h1').classList.add("trigger_h1_animation");
    document.querySelector('.les2b').textContent = "Hello "+document.querySelector('input').value;
}

// wanneer er op submit wordt gedrukt gaat hij renderforms aanroepen in het js bestand
document.querySelector('form').addEventListener('submit',renderForm);