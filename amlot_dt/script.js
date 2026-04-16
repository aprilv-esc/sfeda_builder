


const buttons2 = document.querySelectorAll('.with-link ');


function navigate(url) {
 
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






document.addEventListener("DOMContentLoaded", function () {
  const containers = document.querySelectorAll(".image-container");

  containers.forEach(container => {
    const images = container.querySelectorAll(".clickable-image");
    const gif = container.querySelector(".gif");
    let currentImageIndex = 0;
    let isAnimating = false;

    gif.style.display = "none";

    // Retrieve the state from local storage (if available)
    const savedState = JSON.parse(localStorage.getItem("imageState"));
    if (savedState && savedState[container.id]) {
      currentImageIndex = savedState[container.id];
      images[currentImageIndex].style.display = "inline-block";
    } else {
      images[currentImageIndex].style.display = "inline-block";
    }

    images.forEach((image, index) => {
      image.addEventListener("click", function () {
        if (!isAnimating && index === currentImageIndex) {
          isAnimating = true;

          if (index === 0) {
            // Clicked on image1
            image.style.display = "none";
            gif.style.display = "inline-block";
            setTimeout(function () {
              gif.style.display = "none";
              currentImageIndex++;
              gif.src = gif.getAttribute("data-src");
              images[currentImageIndex].style.display = "inline-block";
              isAnimating = false;

              // Save the updated state to local storage
              const stateToSave = JSON.parse(localStorage.getItem("imageState")) || {};
              stateToSave[container.id] = currentImageIndex;
              localStorage.setItem("imageState", JSON.stringify(stateToSave));
            }, 1900);
          } else if (index === 1) {
            // Clicked on image2
            // Save the state and proceed to the next page
            const stateToSave = JSON.parse(localStorage.getItem("imageState")) || {};
            stateToSave[container.id] = currentImageIndex;
            localStorage.setItem("imageState", JSON.stringify(stateToSave));

            const nextPage = image.getAttribute("data-page");
            window.location.href = nextPage;
          }
        }
      });
    });
  });



  // Refresh button logic
  const refreshButton = document.getElementById("refreshButton");
  refreshButton.addEventListener("click", function () {
    // Clear relevant local storage items
    localStorage.removeItem("imageState");
    localStorage.removeItem("quizScore");
    localStorage.removeItem("container1Status");
    localStorage.removeItem("container2Status");
    localStorage.removeItem("container3Status");
    localStorage.removeItem("container4Status");
    localStorage.removeItem("container5Status");
    localStorage.removeItem("container6Status");
    
    // Reload the page
    location.reload();
    
  });
  const finishButton = document.getElementById("finishButton");
finishButton.addEventListener("click", function () {
  // Clear relevant local storage items
  localStorage.removeItem("imageState");
  localStorage.removeItem("quizScore");
  localStorage.removeItem("container1Status");
  localStorage.removeItem("container2Status");
  localStorage.removeItem("container3Status");
  localStorage.removeItem("container4Status");
  localStorage.removeItem("container5Status");
  localStorage.removeItem("container6Status");
  
  // Reload the page
  location.reload();
  
});
});





function clearLocalStorage() {
  localStorage.removeItem("imageState");
  
}


document.addEventListener("visibilitychange", function() {            
  if (document.visibilityState === "visible" && !sessionStorage.getItem("localStorageCleared")) 
  {     
               clearLocalStorage();               
                sessionStorage.setItem("localStorageCleared", "true");           
               }       
               });



// const container1Status = localStorage.getItem("container1Status");
//                if (container1Status === "correct") {
//                    document.getElementById("container1Status").src = "images/amlotenol/check_quiz.png"; // Replace with the correct image URL
//                }
//                else if(container1Status === "wrong"){
//                 document.getElementById("container1Status").src = "images/amlotenol/wrong_quiz.png";
//                }
               
// const container2Status = localStorage.getItem("container2Status");
//                if (container2Status === "correct") {
//                    document.getElementById("container2Status").src = "images/amlotenol/check_quiz.png"; // Replace with the correct image URL
//                }
//                else if(container2Status === "wrong"){
//                 document.getElementById("container2Status").src = "images/amlotenol/wrong_quiz.png";
//                }




// Define the number of containers you have
const numberOfContainers = 6;

// Loop through each container
for (let i = 1; i <= numberOfContainers; i++) {
  const containerStatus = localStorage.getItem(`container${i}Status`);
  const containerImage = document.getElementById(`container${i}Status`);

  if (containerStatus === "correct") {
    containerImage.src = `images/amlotenol/check_quiz.png`; // Replace with the correct image URL
  } else if (containerStatus === "wrong") {
    containerImage.src = `images/amlotenol/wrong_quiz.png`;
  }
}


// function checkAllContainersCompleted() {
//   for (let i = 1; i <= 6; i++) {
//       const containerStatus = localStorage.getItem(`container${i}Status`);
//       if (containerStatus !== "correct" && containerStatus !== "wrong") {
//           return false; // If any container is not completed, return false
//       }
//   }
//   return true; // All containers are completed
// }

// // Check if all containers are completed and show the popup
// if (checkAllContainersCompleted()) {
//   const popup = document.getElementById("popup");
//   popup.style.display = "block";
// }


function calculateScore() {
  let correctCount = 0;
  for (let i = 1; i <= 6; i++) {
      const containerStatus = localStorage.getItem(`container${i}Status`);
      if (containerStatus === "correct") {
          correctCount++;
      }
  }
  return correctCount;
}

// Function to update the score text
function updateScoreText() {
  const score = calculateScore();
  const totalContainers = 6;
  const scoreText = `Your score: ${score}/${totalContainers}`;
  document.getElementById("scoreText").textContent = scoreText;
  const highScore = "Congratulations!";
  const highScoretext = "You did a great job!";
  
  const mediumScore = "You can do better";
  const mediumscoretext = "There's still a room for improvement";

  const lowScore = "Study Further";
  const lowScoretext = "Re-read the Product Details";

  const svgElement = document.querySelector(".image");
  
  if (score > 3) {
    document.getElementById("remarks").textContent = highScore;
    document.getElementById("remarkstext").textContent = highScoretext;
}else if (score > 0 && score < 4){
  document.getElementById("remarks").textContent = mediumScore;
  document.getElementById("remarkstext").textContent = mediumscoretext;

  document.getElementById("scoreText").style.color = "orange";
}else{
  document.getElementById("remarks").textContent = lowScore;
  document.getElementById("remarkstext").textContent = lowScoretext;

  document.getElementById("scoreText").style.color = "red";
}
}

function downloadScoreAsPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const score = calculateScore();
  const totalContainers = 6;

  // Create the content for the PDF
  const pdfContent = `Score: ${score}/${totalContainers}`;
  const question1 = "Q1: Can you take atenolol and amlodipine together at the same time?";
  const question2 = "Q2: What is the difference between amlodipine and atenolol tablets?";
  const question3 = "Q3: Is Atenolol safe for kidneys?";
  const question4 = "Q4: What type of antihypertensive is atenolol?";
  const question5 = "Q5: How many mg are in amlodipine and atenolol tablets?";
  const question6 = "Q6: Does atenolol lower blood pressure or heart rate?";
 

  const answer1 = "A: atenolol and amlodipine combination exerts a superior effect on blood pressure, blood pressure variability, baroreflex sensitivity and end-organ damage. The superior effect of the combination was observed in all four models of hypertension.";
  const answer2 = "A: Amlodipine is a calcium channel blocker which works by relaxing blood vessels while atenolol is a beta blocker which works specifically on the heart to slow down the heart rate.";
  const answer3 = "A: Kidney disease—Use with caution. The effects may be increased because of slower removal from the body ";
  const answer4 = "A:  Atenolol is a beta blocker medicine, used to treat high blood pressure (hypertension) and irregular heartbeats (arrhythmia).";
  const answer5 = "A: Adult: Per tablet contains atenolol 25 or 50 mg and amlodipine (as besylate) 5 mg: 1 tab once daily, may increase to 2 tablets daily if needed. Elderly: Per tablet contains atenolol 25 mg and amlodipine (besylate) 5 mg: Initiate with 1 tablet daily.";
  const answer6 = "A: Atenolol is a second-generation beta-1-selective adrenergic antagonist that reduces heart rate and blood pressure and decreases myocardial contractility. It is FDA-approved and indicated in treating hypertension, angina pectoris, and acute myocardial infarction.";


  // Add the content to the PDF
  doc.setFontSize(22); // Increase font size
doc.setFont("helvetica", "bold");
doc.setTextColor(51, 126, 205);
  doc.text(pdfContent, 90, 10);

  doc.setFontSize(12); // Reset to the default font size
doc.setFont("helvetica","normal");
doc.setTextColor(0,0,0);

  doc.text(question1, 10, 20);
  const answer1Lines = doc.splitTextToSize(answer1, doc.internal.pageSize.width - 20);
  doc.text(answer1Lines, 10, 25);

  doc.text(question2, 10, 45);
  const answer2Lines = doc.splitTextToSize(answer2, doc.internal.pageSize.width - 20);
  doc.text(answer2Lines, 10, 50);

  doc.text(question3, 10, 65);
  const answer3Lines = doc.splitTextToSize(answer3, doc.internal.pageSize.width - 20);
  doc.text(answer3Lines, 10, 70);

  doc.text(question4, 10, 85);
  const answer4Lines = doc.splitTextToSize(answer4, doc.internal.pageSize.width - 20);
  doc.text(answer4Lines, 10, 90);

  doc.text(question5, 10, 105);
  const answer5Lines = doc.splitTextToSize(answer5, doc.internal.pageSize.width - 20);
  doc.text(answer5Lines, 10, 110);

  doc.text(question6, 10, 130);
  const answer6Lines = doc.splitTextToSize(answer6, doc.internal.pageSize.width - 20);
  doc.text(answer6Lines, 10, 135);


  


  // Download the PDF
  doc.save("amlotenolQuiz_Result.pdf");
}
function checkAllContainersCompleted() {
  for (let i = 1; i <= 6; i++) {
      const containerStatus = localStorage.getItem(`container${i}Status`);
      if (containerStatus !== "correct" && containerStatus !== "wrong") {
          return false; // If any container is not completed, return false
      }
  }
  return true; // All containers are completed
}

// Check if all containers are completed and show the popup
if (checkAllContainersCompleted()) {
  const popup = document.getElementById("popup");
  popup.style.display = "block";
  updateScoreText();
}

// document.getElementById("downloadButton").addEventListener("click", function() {
//   downloadScoreAsPDF();
// });
const viewResults = document.querySelector(".view-results");
// Function to close the popup
function closePopup() {
  const popup = document.getElementById("popup");
  popup.style.display = "none";
  viewResults.style.display = "block";
}
function openPopup() {
  const popup = document.getElementById("popup");
  popup.style.display = "block";
}



const dismissButton = document.querySelector(".dismiss");


if (dismissButton) {
  dismissButton.addEventListener("click", closePopup);
  
}

if (viewResults) {
  viewResults.addEventListener("click", openPopup);
  
}



































