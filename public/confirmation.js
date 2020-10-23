



var modal = document.getElementById("myModal");
document.getElementById('paymentSuccess').style.display = 'none'
document.getElementById('paymentCancelled').style.display = 'none'
document.getElementById('paymentError').style.display = 'none'
document.getElementById('paymentRefused').style.display = 'none'


function showFinalResult (result) {
    modal.style.display = "block"
    switch(result) {
        case "Authorised":
            document.getElementById('paymentSuccess').style.display = 'block'
          break;
        case "Cancelled":
            document.getElementById('paymentCancelled').style.display = 'block'
          break;
        case "Error":
            document.getElementById('paymentError').style.display = 'block'
          break;
        case "Refused":
            document.getElementById('paymentRefused').style.display = 'block'
          break;
        
      }
    makeScreenUnclickable() 
    messageTimeout ()      
}


function messageTimeout () {
    setTimeout(() => {      
        window.location = 'http://localhost:5000'      
    }, 4000); 
}

function makeScreenUnclickable() {
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "block";
        }
    }  
}

window.onload = showFinalResult(result)


