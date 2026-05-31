let salesChart;
let salesProfitChart;
let distributionChart;
let regionChart;
let categoryChart;

document.addEventListener("DOMContentLoaded", function () {

let csvInput = document.getElementById("csvFile");
let runBtn = document.getElementById("runBtn");
let fileName = document.getElementById("fileName");

runBtn.disabled = true;

csvInput.addEventListener("change", function () {

if (csvInput.files.length > 0) {

runBtn.disabled = false;

fileName.innerHTML =
"Dataset Loaded: " + csvInput.files[0].name + " ✔";

console.log("CSV file selected");

}

});

});


function runAnalysis(){

console.log("Run Analysis clicked");

let region = document.getElementById("region").value;
let fileInput = document.getElementById("csvFile");
let runBtn = document.getElementById("runBtn");

if(fileInput.files.length === 0){
alert("Please upload a CSV file first.");
return;
}

/* disable button during processing */
runBtn.disabled = true;

let file = fileInput.files[0];

document.getElementById("loading").style.display = "block";

let formData = new FormData();
formData.append("file", file);
formData.append("region", region);

fetch("http://127.0.0.1:5000/analyze", {

method: "POST",
body: formData

})

.then(response => {

console.log("Server response:", response.status);
return response.json();

})

.then(data => {

console.log("API DATA:", data);

document.getElementById("loading").style.display = "none";

/* enable button again */
runBtn.disabled = false;

document.getElementById("sales").innerText = "$" + data.total_sales.toFixed(2);
document.getElementById("profit").innerText = "$" + data.total_profit.toFixed(2);
document.getElementById("prediction").innerText = "$" + data.prediction.toFixed(2);
document.getElementById("orders").innerText = data.total_orders;

let insight = document.getElementById("predictedValue");
if(insight){
insight.innerText = "$" + data.prediction.toFixed(2);
}

let now = new Date();
document.getElementById("lastUpdated").innerText =
"Last Updated: " + now.toLocaleString();

createCharts(data);

})

.catch(error => {

console.error("FETCH ERROR:", error);

document.getElementById("loading").style.display = "none";

/* enable button again if error occurs */
runBtn.disabled = false;

alert("Backend connection failed");

});

}



function createCharts(data){

const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const labels = data.months.map(m => monthNames[m-1]);

if(salesChart) salesChart.destroy();
if(salesProfitChart) salesProfitChart.destroy();
if(distributionChart) distributionChart.destroy();
if(regionChart) regionChart.destroy();
if(categoryChart) categoryChart.destroy();


salesChart = new Chart(document.getElementById("salesChart"), {

type:"line",

data:{
labels:labels,
datasets:[{

label:"Monthly Sales Trend",
data:data.sales_data,
borderColor:"#00e5ff",
backgroundColor:"rgba(0,229,255,0.2)",
borderWidth:3,
tension:0.3

}]

},

options:{
animation:{duration:1500}
}

});


salesProfitChart = new Chart(document.getElementById("salesProfitChart"), {

type:"scatter",

data:{
datasets:[{

label:"Sales vs Profit",

data:data.sales_data.map((s,i)=>({

x:s,
y:data.profit_data[i] || 0

})),

backgroundColor:"#FF9800"

}]
},

options:{
animation:{duration:1500}
}

});


distributionChart = new Chart(document.getElementById("distributionChart"), {

type:"bar",

data:{
labels:labels,
datasets:[{
label:"Sales Distribution",
data:data.sales_data,
backgroundColor:"#4CAF50"
}]
},

options:{
animation:{duration:1500}
}

});


regionChart = new Chart(document.getElementById("regionChart"), {

type:"bar",

data:{
labels:Object.keys(data.region_sales),
datasets:[{

label:"Region Sales",
data:Object.values(data.region_sales),

backgroundColor:[
"#FF6384",
"#36A2EB",
"#FFCE56",
"#4CAF50"
]

}]
},

options:{
animation:{duration:1500}
}

});


categoryChart = new Chart(document.getElementById("categoryChart"), {

type:"pie",

data:{
labels:Object.keys(data.category_sales),
datasets:[{

data:Object.values(data.category_sales),

backgroundColor:[
"#FF6384",
"#36A2EB",
"#FFCE56",
"#4CAF50",
"#9C27B0"
]

}]
},

options:{
animation:{duration:1500}
}

});

}