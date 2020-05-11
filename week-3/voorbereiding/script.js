var job1 = "Job";
var job2 = "Job1";
var job3 = "Job2";

function groet(naam){
    console.log("Hallo " + naam);

    document.querySelector("h1").textContent = "Hallo " + naam;
}

groet(job1 + job2 + job3);