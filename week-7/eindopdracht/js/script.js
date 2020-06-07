// Buttons to feed festivalgotchi
eetButton = document.querySelector('input#eten');
drinkButton = document.querySelector('input#water');
knuffelButton = document.querySelector('input#knuffel');

// Random values to add to function randomGetal
var eetPunten = [5,10,15,20,25];
var knuffelPunten = [4,8,12,16];
var drinkPunten = [2,4,6,8,10];

// Text to display when action on festivalgotchi
resetButton = document.querySelector('input#reset');
overleden = document.querySelector('article');
var tekst = document.getElementById('tekst');

balk.innerHTML = 60;
var teller = 60;

// Array with images
afbeelding = ['bijna-overleden.jpg', 'content.jpg', 'extreme-happy.jpg', 'happy.jpg', 'minder-blij.jpg', 'overleden.jpg'];

// Functions to get festivalgotchi work
function renderNaam(e) {

    // Object from input values
    var festivalgotchi = {
        naam: document.querySelector('input#naam').value,
        leeftijd: document.querySelector('input#leeftijd').value,
        geboortestad: document.querySelector('input#geboortestad').value
    };

    // retrieve name for input
    document.querySelector('h1').textContent = festivalgotchi.naam + ", " + festivalgotchi.leeftijd + " jaar oud uit " + festivalgotchi.geboortestad;

    // replace text with inpunt
    var naamGotchi = document.getElementById('naamgotchi').innerHTML;
    var vervangNaam = naamGotchi.replace('festivalgotchi', festivalgotchi.naam);

    document.getElementById('naamgotchi').innerHTML = vervangNaam;

    // add a class to start
    document.querySelector('section').classList.add('beginverzorgen');
    document.querySelector('form').classList.add('joep');
    
    e.preventDefault();
}

function randomGetal(waarde){
    var randomPunten = waarde[Math.floor(Math.random() * waarde.length)];
    var geefPunten = document.getElementById('balk');

    geefPunten.innerHTML = parseInt(geefPunten.innerHTML)+randomPunten;
    console.log(randomPunten);
}

function afteller(){

    // change of image
    var foto = document.getElementById('status');
    
    if (teller <= 100){

        var balk = document.getElementById('balk');
        var secondeteller = setInterval(tel, 1000);
        var breedte = balk.innerHTML;
        
        function tel(){
            
            // Class for when festivalgotchi dies
            document.querySelector('article').classList.remove('overleden');

            breedte--;
            balk.innerHTML--;


            if (balk.innerHTML >= 110){
                balk.innerHTML = 110;
            }

            else if (balk.innerHTML >= 101){
                foto.src = "img/" + afbeelding[2];
                tekst.innerHTML = "Ik ga best hard.. misschien even rusten";
                overleden.classList.add('overleden');
            }
        
            else if (balk.innerHTML >= 76 && balk.innerHTML <= 100){
                foto.src = "img/" + afbeelding[3];
                tekst.innerHTML = "Ik voel me goed!";
            }
        
            else if (balk.innerHTML >= 51 && balk.innerHTML <= 75){
                foto.src = "img/" + afbeelding[1];
                tekst.innerHTML = "Het kan altijd beter!";
            }
        
            else if (balk.innerHTML >= 26 && balk.innerHTML <= 50){
                foto.src = "img/" + afbeelding[4];
                tekst.innerHTML = "Ik voel me niet zo lekker..";
            }
        
            else if (balk.innerHTML >= 1 && balk.innerHTML <= 25){
                foto.src = "img/" + afbeelding[0];
                tekst.innerHTML = "Ben je daar nog.. help!";
            }

            if(breedte == 0){
                clearInterval(secondeteller);
                foto.src = "img/" + afbeelding[5];
                tekst.innerHTML = "..................";

                teller = 0;

                resetButton.classList.add('resetbutton');
                overleden.classList.add('overleden');

            } else {
                balk.style.width = balk.innerHTML + "%";
            }
        }
    }
}

afteller();

function resetgotchi(){
    location.reload();
 }


// Eventlisteners
eetButton.addEventListener('click', function(){ 
    randomGetal(eetPunten); 
    tekst.innerHTML = "Wat had ik een honger zeg!";
});

drinkButton.addEventListener('click', function(){ 
    randomGetal(drinkPunten);
    tekst.innerHTML = "Wat had ik een dorst zeg!"; 
});

knuffelButton.addEventListener('click', function(){ 
    randomGetal(knuffelPunten);
    tekst.innerHTML = "Wat had ik een behoefte aan een knuffel zeg!"; 
});

document.querySelector('form').addEventListener('submit',renderNaam);
document.querySelector('input#reset').addEventListener('click', resetgotchi);