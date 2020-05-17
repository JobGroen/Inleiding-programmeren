// var Afbeelding = document.querySelector("img").src = "img/bulb_on.jpg";

var statusVanHetLampje = "uit";

function klik(){
    if (statusVanHetLampje == "uit"){
        document.querySelector("img").src = "img/bulb_on.jpg";
        statusVanHetLampje = "aan";
        console.log(statusVanHetLampje);
    } else {
        document.querySelector("img").src = "img/bulb_off.jpg";
        statusVanHetLampje = "uit";
        console.log(statusVanHetLampje);
    }
}

function blink(){
    setInterval(klik, 200);
}


// document.querySelector("img").addEventListener("click", klik);
document.querySelector("img").addEventListener("mouseover", klik);
document.querySelector("img").addEventListener("dblclick", blink);

