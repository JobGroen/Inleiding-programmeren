


var halloKnop = document.querySelector('#hallo');
var daagKnop = document.querySelector('#daag');
var easterEgg = document.querySelector('#eng');

var antwoordTekst = document.querySelector('#antwoord');

function zegHallo() {
    antwoordTekst.textContent = 'Hallo. Wie is daar?';
    document.getElementById('hallomannetje').src="_img/hallomannetje.png";
}

function zegDoei() {
    antwoordTekst.textContent = 'Tot ziens, het was me een genoegen!';
    document.getElementById('hallomannetje').src="_img/hallomannetje.png";
}

function veranderImg() {
    document.getElementById('hallomannetje').src="_img/jobgroen.jpg";
    antwoordTekst.textContent = 'Eng he';
}

halloKnop.addEventListener('click', zegHallo);
daagKnop.addEventListener('click', zegDoei);
easterEgg.addEventListener('click', veranderImg);