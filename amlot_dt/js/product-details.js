// const opendd = document.getElementById("opendd");
// const openvid = document.getElementById("opendd-vid");
// const openqna = document.getElementById("opendd-qna");

// const ddcontainer = document.getElementById("dropdown-container-pd");
// const vidcontainer = document.getElementById("dropdown-container-vid");
// const qnacontainer = document.getElementById("dropdown-container-qna");

// opendd.addEventListener("click", function () {
//      // Prevent the click event from reaching the outer button
//   event.stopPropagation();
//   // Add your desired logic for the inner button here
//   console.log("Inner button clicked");
//   console.log("open");
//   if (
//     ddcontainer.style.display === "none" ||
//     ddcontainer.style.display === ""
//   ) {
//     ddcontainer.style.display = "block";
    
//   } else {
//     ddcontainer.style.display = "none";
//   }
// });

// openvid.addEventListener("click", function () {
//   // Prevent the click event from reaching the outer button
// event.stopPropagation();
// // Add your desired logic for the inner button here
// console.log("Inner button clicked");
// console.log("open");
// if (
//   vidcontainer.style.display === "none" ||
//   vidcontainer.style.display === ""
// ) {
//   vidcontainer.style.display = "block";
 
// } else {
//   vidcontainer.style.display = "none";
// }
// });


// openqna.addEventListener("click", function () {
//   // Prevent the click event from reaching the outer button
// event.stopPropagation();
// // Add your desired logic for the inner button here
// console.log("Inner button clicked");
// console.log("open");
// if (
//   qnacontainer.style.display === "none" ||
//   qnacontainer.style.display === ""
// ) {
//   qnacontainer.style.display = "block";
 
// } else {
//   qnacontainer.style.display = "none";
// }
// });

// const opendd = document.getElementById("opendd");
// const openvid = document.getElementById("opendd-vid");
// const openqna = document.getElementById("opendd-qna");

// const ddcontainer = document.getElementById("dropdown-container-pd");
// const vidcontainer = document.getElementById("dropdown-container-vid");
// const qnacontainer = document.getElementById("dropdown-container-qna");

// function closeAllDropdowns() {
//   ddcontainer.style.display = "none";
//   vidcontainer.style.display = "none";
//   qnacontainer.style.display = "none";
// }

// opendd.addEventListener("click", function () {
//   event.stopPropagation();
//   closeAllDropdowns();
//   ddcontainer.style.display = "block";
// });

// openvid.addEventListener("click", function () {
//   event.stopPropagation();
//   closeAllDropdowns();
//   vidcontainer.style.display = "block";
// });

// openqna.addEventListener("click", function () {
//   event.stopPropagation();
//   closeAllDropdowns();
//   qnacontainer.style.display = "block";
// });



const opendd = document.getElementById("opendd");
const openvid = document.getElementById("opendd-vid");
const openqna = document.getElementById("opendd-qna");

const ddcontainer = document.getElementById("dropdown-container-pd");
const vidcontainer = document.getElementById("dropdown-container-vid");
const qnacontainer = document.getElementById("dropdown-container-qna");

opendd.addEventListener("click", function () {
  event.stopPropagation();
  toggleDropdown(ddcontainer);
  closeDropdowns([vidcontainer, qnacontainer]);
});

openvid.addEventListener("click", function () {
  event.stopPropagation();
  toggleDropdown(vidcontainer);
  closeDropdowns([ddcontainer, qnacontainer]);
});

openqna.addEventListener("click", function () {
  event.stopPropagation();
  toggleDropdown(qnacontainer);
  closeDropdowns([ddcontainer, vidcontainer]);
});

function toggleDropdown(container) {
  if (container.style.display === "none" || container.style.display === "") {
    container.style.display = "block";
  } else {
    container.style.display = "none";
  }
}

function closeDropdowns(dropdownsToClose) {
  dropdownsToClose.forEach(function (container) {
    container.style.display = "none";
  });
}







document.getElementById("backButton").addEventListener("click", function(event) {
  event.preventDefault(); // Prevent the link from navigating
  // Use the browser's built-in history object to go back to the previous page
  window.history.back();
});

// function storePreviousPage() {
//   sessionStorage.setItem('previousPage', window.location.href);
// }
// document.getElementById("backButton").addEventListener("click", function(event) {
//   event.preventDefault();

//   // Check if there is a referring page stored in session storage
//   const referringPage = sessionStorage.getItem('referringPage');

//   if (referringPage) {
//     // Navigate to the referring page
//     window.location.href = referringPage;
//   } else {
//     // Use the default behavior to go back
//     window.history.back();
//   }
// });




// document.getElementById("backButton").addEventListener("click", function(event) {
//   event.preventDefault();

//   // Check if there is a previous page stored in session storage
//   const previousPage = sessionStorage.getItem('previousPage');

//   if (previousPage) {
//     sessionStorage.removeItem('previousPage');
//     // Navigate to the previous page
//     window.location.href = previousPage;
//   } else {
//     // Use the default behavior to go back
//     window.history.back();
//   }
// });

// document.getElementById("backButton").addEventListener("click", function() {
//   // Get the previous page URL from the browser history.
//   var previousPageUrl = window.history.state.back;

//   // Check if the previous page is a quiz page.
//   if (previousPageUrl.includes("/question")) {
//     // Go back to the page before the quiz page.
//     window.history.back(-3);
//   } else {
//     // Go back to the previous page.
//     window.history.back(-1);
//   }
// });


// document.getElementById("backButton").addEventListener("click", function(event) {
//   event.preventDefault(); // Prevent the link from navigating

//   // Check if the user is on page 5
//   if (window.location.pathname === '/.html') {
//     // Check the navigation history
//     var history = window.history;
//     if (history.length >= 2) {
//       var currentPageIndex = history.length - 2; // Index of the previous page
//       var previousPage = history[currentPageIndex];
      
//       // Define an array of quiz page names
//       var quizPages = [
//         'question1.html',
//         'question2.html',
//         'question3.html',
//         'question4.html',
//         'question5.html',
//         'question6.html'
//       ];

//       // Check if the previous page is a quiz page
//       if (quizPages.includes(previousPage)) {
//         // Go back one more step in history
//         window.history.go(-2);
//       }
//     }
//   } else {
//     // If not on page 5, simply go back one step in history
//     window.history.back();
//   }
// });

