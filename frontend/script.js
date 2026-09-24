let salesChart;
let salesProfitChart;
let distributionChart;
let regionChart;
let categoryChart;

document.addEventListener("DOMContentLoaded", function () {

let csvInput = document.getElementById("csvFile");
let runBtn = document.getElementById("runBtn");
let fileName = document.getElementById("fileName");

runBtn.disabled = false;

csvInput.addEventListener("change", function () {

if (csvInput.files.length > 0) {

fileName.innerHTML =
"Dataset Loaded: " + csvInput.files[0].name + " ✔";

console.log("CSV file selected");

runAnalysis();

}

});

runAnalysis();

});


function runAnalysis(){

console.log("Run Analysis clicked");

let region = document.getElementById("region").value;
let fileInput = document.getElementById("csvFile");
let runBtn = document.getElementById("runBtn");

runBtn.disabled = true;

document.getElementById("loading").style.display = "block";

let formData = new FormData();
formData.append("region", region);

if (fileInput.files.length > 0) {
let file = fileInput.files[0];
formData.append("file", file);
}

fetch("http://127.0.0.1:5000/analyze", {

method: "POST",
body: formData

})

.then(response => {

console.log("Server response status:", response.status);

return response.json().then(data => {
if (!response.ok) {
throw new Error(data.error || "Server error (" + response.status + ")");
}
return data;
});

})

.then(data => {

console.log("API DATA:", data);

document.getElementById("loading").style.display = "none";

runBtn.disabled = false;

document.getElementById("sales").innerText = "$" + data.total_sales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
document.getElementById("profit").innerText = "$" + data.total_profit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
document.getElementById("prediction").innerText = "$" + data.prediction.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
document.getElementById("orders").innerText = data.total_orders.toLocaleString();

let insight = document.getElementById("predictedValue");
if(insight){
insight.innerText = "$" + data.prediction.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

let now = new Date();
document.getElementById("lastUpdated").innerText =
"Last Updated: " + now.toLocaleString();

createCharts(data);

})

.catch(error => {

console.error("FETCH ERROR:", error);

document.getElementById("loading").style.display = "none";

runBtn.disabled = false;

alert("Backend Communication Error: " + error.message);

});

}



function createCharts(data){

const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const labels = data.months.map(m => monthNames[m-1] || ("Month " + m));

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

label:"Monthly Sales Trend ($)",
data:data.sales_data,
borderColor:"#00e5ff",
backgroundColor:"rgba(0,229,255,0.2)",
borderWidth:3,
tension:0.3,
fill: true

}]

},

options:{
responsive: true,
animation:{duration:1000}
}

});


salesProfitChart = new Chart(document.getElementById("salesProfitChart"), {

type:"scatter",

data:{
datasets:[{

label:"Monthly Sales vs Monthly Profit",

data:data.sales_data.map((s,i)=>({

x: s,
y: data.profit_data[i] || 0

})),

backgroundColor:"#FF9800",
pointRadius: 6

}]
},

options:{
responsive: true,
animation:{duration:1000},
scales: {
x: { title: { display: true, text: "Monthly Sales ($)" } },
y: { title: { display: true, text: "Monthly Profit ($)" } }
}
}

});


let subCatLabels = data.sub_category_sales ? Object.keys(data.sub_category_sales) : labels;
let subCatData = data.sub_category_sales ? Object.values(data.sub_category_sales) : data.sales_data;

distributionChart = new Chart(document.getElementById("distributionChart"), {

type:"bar",

data:{
labels: subCatLabels,
datasets:[{
label:"Sales by Sub-Category ($)",
data: subCatData,
backgroundColor:"#4CAF50"
}]
},

options:{
responsive: true,
animation:{duration:1000}
}

});


regionChart = new Chart(document.getElementById("regionChart"), {

type:"bar",

data:{
labels:Object.keys(data.region_sales),
datasets:[{

label:"Region Sales ($)",
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
responsive: true,
animation:{duration:1000}
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
responsive: true,
animation:{duration:1000}
}

});

}