
// Get all buttons
const buttons2 = document.querySelectorAll('.with-link');

// Function to handle navigation and style changes
function navigate(url) {
  // Remove 'clicked' class from all buttons
  buttons2.forEach(button => {
    button.classList.remove('clicked');
  });

  // Find the button corresponding to the clicked URL and add 'clicked' class
  const clickedButton = Array.from(buttons2).find(button => {
    const buttonUrl = button.getAttribute('onclick').match(/'([^']+)'/)[1];
    return buttonUrl === url;
  });

  if (clickedButton) {
    clickedButton.classList.add('clicked');
  }

  // Redirect to the specified URL
  window.location.href = url;
}

// Add click event listeners to each button
buttons2.forEach(button => {
  button.addEventListener('click', () => {
    const buttonUrl = button.getAttribute('onclick').match(/'([^']+)'/)[1];
    navigate(buttonUrl);
  });
});

// Add 'current' class to the corresponding button based on the current page
document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname.split('/').pop();
  buttons2.forEach(button => {
    const buttonUrl = button.getAttribute('onclick').match(/'([^']+)'/)[1];
    if (buttonUrl === currentPage) {
      button.classList.add('current');
    }
  });
});



const ctx2 = document.getElementById("myChart2").getContext("2d");
/* const radioButtons = document.querySelectorAll('input[name="age"]'); */
var selectedAge = 0
var selectedMedicine = ""
var medText = ""
var textInfo = ""
const data2 = {
    labels: ["SBP", "DBP"],
    datasets: [{
        label: "Data",
        data: [0,0],
        backgroundColor: [
            "#337ecd",
            "#46C1A4"
        ],
        borderColor: [
            "#337ecd",
            "#46C1A4"
        ],
        borderWidth: 1,
        barThickness: 150,
        barPercentage: 0.7, 
        categoryPercentage: 0.8
    },
    {
        label: "Data",
        data: [0,0],
        backgroundColor: [
            "#2269B2",
            "#35A288"
        ],
        borderColor: [
            "#2269B2",
            "#35A288"
        ],
        borderWidth: 1,
        barThickness: 150,
        barPercentage: 0.7, 
        categoryPercentage: 0.8
    }]
};
const options = {
    scales: {
        y: {
            min: 0,  
            max: 70, 
            ticks: {
                stepSize: 10 ,
                font: {
                    
                    weight: 'bold'
                   
                }
            },
            grid: {
                display: false 
            },
            title: {
                display: true,
                text: 'PROPORTIONS OF PATIENTS WHO ACHIEVED BP GOAL', 
                align: 'center',
                font: {
                    size: 11.7,
                    weight: 'bold'
                   
                }
            }
        },
        x: {
            grid: {
                display: false 
            },
            ticks: {
                font: {
                    
                    weight: 'bold'
                   
                }
            }
        }
    },
    plugins: {
        tooltip: {
            mode: "index", 
            intersect: false,callbacks: {
                label: (context) => {
                  const value = context.parsed.y;
                  const percentage = ((value / data2.datasets[0].data.reduce((a, b) => a + b, 0)) * 100).toFixed(2);
                  return `${value}%`;
                }
              } 
        },
        datalabels: { 
            color: "white",
            anchor: "center",
            align: "center",
            font: {
                size: 17 
              },
              formatter: (value, context) => {
                  if (value === 0) {
                return ''; 
            } else {
                return value + '%';
            }}
        },
        legend: {
            display: false
          }
    },
    layout: {
        padding: {
            left: 0, 
            right: 0,
            top: 0,
            bottom: 0,
        }
    }
};

const myChart2 = new Chart(ctx2, {
    type: "bar",
    data: data2,
    options: options,
    plugins: [ChartDataLabels]
});

function updateChartData(selectedOption) {
    myChart2.data.labels = [selectedOption+"/SBP", selectedOption+"/DBP"]
    myChart2.update();
}

const buttonContainer = document.getElementById("buttonContainer");

buttonContainer.addEventListener("click", (event) => {
    const selectedOption = event.target.id;
    const selectedValue = event.target.textContent
    selectedMedicine = selectedOption
    medText = selectedValue
    updateGraph()
    
});
const customTextCanvas = document.getElementById('customTextCanvas');
const customTextContext = customTextCanvas.getContext('2d');
function textDes(text){
    
    const barWidth = myChart2.scales['x'].width / myChart2.data.labels.length;
    const xPos = myChart2.scales['x'].getPixelForValue('SBP') + barWidth / 4;
    const yPos = customTextCanvas.height / 6;
    const canvasWidth = 400; 
    const xPosAdjusted = Math.min(Math.max(xPos, barWidth / 2), canvasWidth - barWidth / 2);
    customTextContext.font = 'bold 11.5px Arial';
    customTextContext.fillStyle = 'black';
    customTextContext.textAlign = 'center';
    customTextContext.clearRect(0, 0, customTextCanvas.width, customTextCanvas.height);
    //customTextContext.fillText(text, xPosAdjusted, yPos);
    wrapText(customTextContext,text, xPosAdjusted+18, yPos, maxWidth, lineHeight)
    /* wrapText(customTextContext,text, xPosAdjusted-100, yPos, maxWidth, lineHeight) 
    original width 200*/
}
const canvasWidth = 250; 
const maxWidth = canvasWidth - 20; 
const lineHeight = 24; 

function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';

    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const testWidth = context.measureText(testLine).width;

        if (testWidth > maxWidth && i > 0) {
            context.fillText(line, x, y);
            line = words[i] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    //animate(line, x, y)
    context.fillText(line, x, y);
}
/* radioButtons.forEach(radioButton => {
  radioButton.addEventListener('change', function() {
    selectedAge = this.value
    updateGraph()
  });
}); */

function animate(line, x, y) {
    customTextContext.clearRect(0, 0, customTextContext.width, customTextContext.height);
    const targetOpacity = 5;
    let currentOpacity = 0;
    currentOpacity += 0.01; 
    if (currentOpacity > targetOpacity) {
        currentOpacity = targetOpacity;
    }

    customTextContext.globalAlpha = currentOpacity;
    customTextContext.font = 'bold 11.8px Arial';
    customTextContext.fillStyle = 'black';
    customTextContext.textAlign = 'center';
    customTextContext.fillText(line,x, y);

    if (currentOpacity < targetOpacity) {
        requestAnimationFrame(animate); 
    }
}

function updateGraph(){
  switch (selectedAge) {
    case 1:
      if (selectedMedicine === "btnMono") {
        myChart2.data.datasets[0].data = [31.4, 42.9];
        myChart2.data.datasets[1].data = [35.4, 33.8];
        updateChartData(medText);
        myChart2.update();
    } else if (selectedMedicine === "btnPlusOne") {
        myChart2.data.datasets[0].data = [38.9, 51.8];
        myChart2.data.datasets[1].data = [48.0, 56.0];
        updateChartData(medText);
        myChart2.update();
    } else if (selectedMedicine === "btnPlusTwo") {
        myChart2.data.datasets[0].data = [33.4, 44.4];
        myChart2.data.datasets[1].data = [57.1, 57.1];
        updateChartData(medText);
        myChart2.update();
    } else if (selectedMedicine === "btnPlusThree") {
        myChart2.data.datasets[0].data = [14.3, 28.6];
        myChart2.data.datasets[1].data = [0.0, 0.0];
        updateChartData(medText);
        myChart2.update();
    }
      break;
    case 2:
      if (selectedMedicine === "btnMono") {
        myChart2.data.datasets[0].data = [31.4, 42.9];
        myChart2.data.datasets[1].data = [25.5, 13.7];
        updateChartData(medText);
        myChart2.update();
    } else if (selectedMedicine === "btnPlusOne") {
        myChart2.data.datasets[0].data = [38.9, 51.8];
        myChart2.data.datasets[1].data = [29.8, 14.0];
        updateChartData(medText);
        myChart2.update();
    } else if (selectedMedicine === "btnPlusTwo") {
        myChart2.data.datasets[0].data = [33.4, 44.4];
        myChart2.data.datasets[1].data = [25.0, 0.0];
        updateChartData(medText);
        myChart2.update();
    } else if (selectedMedicine === "btnPlusThree") {
        myChart2.data.datasets[0].data = [14.3, 28.6];
        myChart2.data.datasets[1].data = [0.0, 0.0];
        updateChartData(medText);
        myChart2.update();
    }
      break;
      case 0:
        if (selectedMedicine === "btnMono") {
            myChart2.data.datasets[0].data = [31.4, 42.9];
            myChart2.data.datasets[1].data = [0.0, 0.0];
            updateChartData(medText);
            myChart2.update();
        } else if (selectedMedicine === "btnPlusOne") {
            myChart2.data.datasets[0].data = [38.9, 51.8];
            myChart2.data.datasets[1].data = [0.0, 0.0];
            updateChartData(medText);
            myChart2.update();
        } else if (selectedMedicine === "btnPlusTwo") {
            myChart2.data.datasets[0].data = [33.4, 44.4];
            myChart2.data.datasets[1].data = [0.0, 0.0];
            updateChartData(medText);
            myChart2.update();
        } else if (selectedMedicine === "btnPlusThree") {
            myChart2.data.datasets[0].data = [14.3, 28.6];
            myChart2.data.datasets[1].data = [0.0, 0.0];
            updateChartData(medText);
            myChart2.update();
        }
          break;
    default:

  }
  if(selectedMedicine ==="btnPlusOne"){
      textDes("AMLODIPINE + 1AHD (ATENOLOL) HELP REDUCES CORONARY EVENTS BY 40% & CEREBROVASCULAR EVENTS BY 54%")
  }
  else{
      textDes("")
  }
}
const buttons = document.querySelectorAll('#buttonContainer button');

buttons.forEach(button => {
  button.addEventListener('click', function() {
    buttons.forEach(btn => {
      btn.classList.remove('selected');
    });
    this.classList.add('selected');
  });
});
const valueSlider = document.getElementById('valueSlider');
const sliderValues = document.querySelectorAll('.slider-value');

valueSlider.addEventListener('input', function() {
  const value = Number(valueSlider.value);

  for (const val of sliderValues) {
    val.classList.remove('active');
  }

  sliderValues[value].classList.add('active');
  selectedAge = value
  if (value === 0) {
    valueSlider.style.background = `linear-gradient(to right, #007bff 0%, #007bff 0%, #ddd 0%)`;
  } else if (value === 1) {
    valueSlider.style.background = `linear-gradient(to right, #007bff 0%, #007bff 50%, #ddd 50%)`;
  } else if (value === 2) {
    valueSlider.style.background = `linear-gradient(to right, #007bff 0%, #007bff 100%, #ddd 100%)`;
  }
  updateGraph()
});


/* backup plugins: {
    tooltip: {
        mode: "index", 
        intersect: false,callbacks: {
            label: (context) => {
              const value = context.parsed.y;
              const percentage = ((value / data2.datasets[0].data.reduce((a, b) => a + b, 0)) * 100).toFixed(2);
              return `${value} (${value}%)`;
            }
          } 
    },
    datalabels: { 
        color: "white",
        anchor: "center",
        align: "center",
        font: {
            size: 17 
          },
          formatter: (value, context) => value + '%' 
    },
    legend: {
        display: false
      }
}, */