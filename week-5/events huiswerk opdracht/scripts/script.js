// variable
var bodyElement = document.querySelector("body");

bodyElement.innerHTML = '<h1></h1>';

document.querySelector("h1").textContent = "EVENTS!";


// functions
function toonClick(){
    document.querySelector("h1").textContent = "CLICK";
}

function DblClick(){
    document.querySelector("h1").textContent = "DOUBLECLICK";
}

function HoldClick(){
    document.querySelector("h1").textContent = "ON MOUSE DOWN";
}

function MouseClick(){
    document.querySelector("h1").textContent = "ON MOUSE DOWN";
}

function OffClick(){
    document.querySelector("h1").textContent = "VAN TEKST VANDAAN";
}

// event handlers 
document.querySelector("h1").addEventListener("click", toonClick);
document.querySelector("h1").addEventListener("dblclick", DblClick);
document.querySelector("h1").addEventListener("mousedown", HoldClick);
document.querySelector("h1").addEventListener("mouseover", MouseClick);
document.querySelector("h1").addEventListener("mouseout", OffClick);






