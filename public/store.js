if (document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', ready)
} else {
    ready()
}

function ready() {
    var removeCartItemButtons = document.getElementsByClassName('btn-danger')
    for (var i = 0; i < removeCartItemButtons.length; i++) {
        var button = removeCartItemButtons[i]
        button.addEventListener('click', removeCartItem)
    }

    var quantityInputs = document.getElementsByClassName('cart-quantity-input')
    for (var i = 0; i < quantityInputs.length; i++) {
        var input = quantityInputs[i]
        input.addEventListener('change', quantityChanged)
    }

    var addToCartButtons = document.getElementsByClassName('shop-item-button')
    for (var i = 0; i < addToCartButtons.length; i++) {
        var button = addToCartButtons[i]
        button.addEventListener('click', addToCartClicked)
    }
    document.getElementsByClassName('btn-purchase')[0].addEventListener('click', purchaseClicked)
}

function showFinalResult (response) {
    if(response.resultCode = "Authorised'"){
        paymentSuccessMsg()
    } else {
        alert('There was an issue processing you payment')
    } 
}


function itemsArray (){
    var itemsArray = []
    var cartItemContainer = document.getElementsByClassName('cart-items')[0]
    var cartRows = cartItemContainer.getElementsByClassName('cart-row')
    for( let i = 0; i < cartRows.length; i++ ) {
        const cartRow = cartRows[i]
        const quantityElement = cartRow.getElementsByClassName('cart-quantity-input')[0]
        const quantity = quantityElement.value
        var id = cartRow.dataset.itemId
        itemsArray.push({
            id:id,
            quantity: quantity
        })
    }
    return itemsArray
}

function makePayment (data){
    let items = itemsArray()
    return fetch('/makepayment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'appllcation/json'
        },
        body: JSON.stringify({
            data: data,
            items: items
        })
    }).then(res => {
        return res.json()
    }).then(info => {
        return info
    }).catch(error => {
        console.error(error)
    }) 
}
   


function adyenHandler (){
    let items = itemsArray()
    fetch('/purchase', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'appllcation/json'
        },
        body: JSON.stringify({
            items: items
        })
    }).then(res => {
        return res.json()
    }).then(data => {
        const configuration = {
            paymentMethodsResponse: data, // The `/paymentMethods` response from the server.
            clientKey: adyenClientKey, // Web Drop-in versions before 3.10.1 use originKey instead of clientKey.
            locale: "en-US",
            environment: "test",
            onSubmit: (state, dropin) => {
                // Your function calling your server to make the `/payments` request
                processingPaymentMsg()
                makePayment(state.data)
                  .then(response => {
                    if (response.action) {
                      // Drop-in handles the action object from the /payments response
                      dropin.handleAction(response.action);
                    } else {
                      // Your function to show the final result to the shopper
                      showFinalResult(response);
                    }
                  })
                  .catch(error => {
                    throw Error(error);
                  });
              },
              onAdditionalDetails: (state, dropin) => {
                // Your function calling your server to make a `/payments/details` request
                makeDetailsCall(state.data)
                  .then(response => {
                    if (response.action) {
                      // Drop-in handles the action object from the /payments response
                      dropin.handleAction(response.action);
                    } else {
                      // Your function to show the final result to the shopper
                      showFinalResult(response);
                    }
                  })
                  .catch(error => {
                    throw Error(error);
                  });
              },
              paymentMethodsConfiguration: {
                card: { // Example optional configuration for Cards
                  hasHolderName: true,
                  holderNameRequired: true,
                  enableStoreDetails: true,
                  hideCVC: false, // Change this to true to hide the CVC field for stored cards
                  name: 'Credit or debit card',
                  billingAddressRequired: true
                }
              }
        
           };
        
        const checkout = new AdyenCheckout(configuration);
        const dropin = checkout.create('dropin').mount('#dropin-container');

    }).catch(function(error) {
        console.error(error)
    })
}

// var priceElement = document.getElementsByClassName('cart-total-price')[0]
// var price = parseFloat(priceElement.innerText.replace('$', '')) * 100



var modal = document.getElementById("myModal");
document.getElementById('paymentSuccess').style.display = 'none'

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];
// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = "none";
    cleanup();  
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
        cleanup();
    }
}

var cleanup = function () {
    var newElement = document.createElement('div')
    newElement.id = 'dropin-container'
    var element = document.getElementById('dropin-container');
    element.parentNode.replaceChild( newElement, element);
}



function purchaseClicked() {
    let total = document.getElementsByClassName('cart-total-price')[0].innerText
    if(total == '$0'){
        alert('Please add some items to the cart')
    } else {
        modal.style.display = "block";
        adyenHandler()
    }
}

function processingPaymentMsg () {  
    document.getElementById('process').style.display = 'block' 
    document.getElementById('dropin-container').style.display = 'none'
    document.getElementById('paymentSuccess').style.display = 'none'
    span.style.display ='none'
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "block";
        }
    }  
}

function paymentSuccessMsg (){
    document.getElementById('process').style.display = 'none' 
    document.getElementById('dropin-container').style.display = 'none'
    document.getElementById('paymentSuccess').style.display = 'block'
    span.style.display ='none'
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "block";
        }
    }  
    setTimeout(() => {      
        window.location = 'http://localhost:5000'      
    }, 4000);    
}




// var cartItems = document.getElementsByClassName('cart-items')[0]
// while (cartItems.hasChildNodes()) {
//     cartItems.removeChild(cartItems.firstChild)
// }
// updateCartTotal()

function removeCartItem(event) {
    var buttonClicked = event.target
    buttonClicked.parentElement.parentElement.remove()
    updateCartTotal()
}

function quantityChanged(event) {
    var input = event.target
    if (isNaN(input.value) || input.value <= 0) {
        input.value = 1
    }
    updateCartTotal()
}

function addToCartClicked(event) {
    var button = event.target
    var shopItem = button.parentElement.parentElement
    var title = shopItem.getElementsByClassName('shop-item-title')[0].innerText
    var price = shopItem.getElementsByClassName('shop-item-price')[0].innerText
    var imageSrc = shopItem.getElementsByClassName('shop-item-image')[0].src
    var id = shopItem.dataset.itemId
    addItemToCart(title, price, imageSrc, id)
    updateCartTotal()
}

function addItemToCart(title, price, imageSrc, id) {
    var cartRow = document.createElement('div')
    cartRow.classList.add('cart-row')
    cartRow.dataset.itemId = id
    var cartItems = document.getElementsByClassName('cart-items')[0]
    var cartItemNames = cartItems.getElementsByClassName('cart-item-title')
    for (var i = 0; i < cartItemNames.length; i++) {
        if (cartItemNames[i].innerText == title) {
            alert('This item is already added to the cart')
            return
        }
    }
    var cartRowContents = `
        <div class="cart-item cart-column">
            <img class="cart-item-image" src="${imageSrc}" width="100" height="100">
            <span class="cart-item-title">${title}</span>
        </div>
        <span class="cart-price cart-column">${price}</span>
        <div class="cart-quantity cart-column">
            <input class="cart-quantity-input" type="number" value="1">
            <button class="btn btn-danger" type="button">REMOVE</button>
        </div>`
    cartRow.innerHTML = cartRowContents
    cartItems.append(cartRow)
    cartRow.getElementsByClassName('btn-danger')[0].addEventListener('click', removeCartItem)
    cartRow.getElementsByClassName('cart-quantity-input')[0].addEventListener('change', quantityChanged)
}

function updateCartTotal() {
    var cartItemContainer = document.getElementsByClassName('cart-items')[0]
    var cartRows = cartItemContainer.getElementsByClassName('cart-row')
    var total = 0
    for (var i = 0; i < cartRows.length; i++) {
        var cartRow = cartRows[i]
        var priceElement = cartRow.getElementsByClassName('cart-price')[0]
        var quantityElement = cartRow.getElementsByClassName('cart-quantity-input')[0]
        var price = parseFloat(priceElement.innerText.replace('$', ''))
        var quantity = quantityElement.value
        total = total + (price * quantity)
    }
    total = Math.round(total * 100) / 100
    document.getElementsByClassName('cart-total-price')[0].innerText = '$' + total
}
