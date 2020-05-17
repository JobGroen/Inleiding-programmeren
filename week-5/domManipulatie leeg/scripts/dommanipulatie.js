var supTitle = document.getElementById("hook1");
var Afbeelding = document.getElementById("hook4");

var eerste = document.querySelector("h2").firstElementChild.classList.add("blink");


var allH2s = document.querySelectorAll("h2");

for(var i = 0; i < allH2s.length; i++){
    //wat je hier tussen zet, herhaalt zich
    //net zo vaak als er elementen in
    //de array zitten array.length
    console.log(allH2s[i]);
}


document.getElementById("hook1").textContent = "OM wil Job en Randy jarenlang achter tralies hebben.";
document.getElementById("hook4").src = "images/job.jpg";

console.log(supTitle);