

$(document).on('click', '.remove-from-cart', function(e) {
  e.preventDefault();

  const productId = $(this).data('id');
  const itemElement = $(this).closest('.row'); 

  Swal.fire({
    title: 'Are you sure?',
    text: "You are about to remove this item from the cart",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, remove it!'
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        url: '/removeFromCart/' + productId,
        type: 'DELETE',
        success: function(result) {
          // Remove the item from the DOM
          itemElement.remove();

          // Update the total price in the DOM
          $('.priceChange').text('₹  ' + result.total.toFixed(2));

          // Update the grand total in the DOM
          $('.gtotal').text('₹  ' + result.grandTotal.toFixed(2));

          // Update the number of items in the cart
          const itemCount = result.items.length;
          $('.d-flex.justify-content-between.align-items-center.mb-5 h6').text(itemCount + ' items');
          $('.d-flex.justify-content-between.mb-4 h3').text('Items in cart: ' + itemCount);
        },
        error: function(err) {
          // Display the error message using SweetAlert
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: err.responseJSON.message,
          });
        }
      });
    }
  });
});


$(document).on('click', '.increment-button', function(e) {
  e.preventDefault();

  const productId = $(this).closest('.row').find('.remove-from-cart').data('id');
  console.log(productId);  // Add this line

  const quantityElement = $(this).siblings('h6[name="quantity"]');
  let quantity = parseInt(quantityElement.text());

  $.ajax({
    url: '/incrementQuantity/' + productId,
    type: 'PUT',
    success: function(result) {
      // Increment the quantity in the DOM
      quantity++;
      quantityElement.text(quantity);

      // Update the total price in the DOM
      $('.priceChange').text('₹  ' + result.total.toFixed(2));

      // Update the grand total in the DOM
      $('.gtotal').text('₹  ' + result.grandTotal.toFixed(2));
    },
    error: function(err) {
      if (err.responseJSON && err.responseJSON.message) {
        // Display your flash message here
        Swal.fire({
          icon: 'warning',
          title: 'Oops...',
          text:   'Only ' + err.responseJSON.availableQuantity +" pices of "+err.responseJSON.message
        });
      } else {
        console.error(err);
      }
    }
  });
});



$(document).on('click', '.decrement-button', function(e) {
  e.preventDefault();

  const productId = $(this).closest('.row').find('.remove-from-cart').data('id');
  console.log(productId);  // Add this line

  const quantityElement = $(this).siblings('h6[name="quantity"]');
  let quantity = parseInt(quantityElement.text());

  // Do not allow the quantity to go below 1
  if (quantity <= 1) {
    return;
  }

  $.ajax({
    url: '/decrementQuantity/' + productId,
    type: 'PUT',
    success: function(result) {
      // Decrement the quantity in the DOM
      quantity--;
      quantityElement.text(quantity);

      // Update the total price in the DOM
      $('.priceChange').text('₹  ' + result.total.toFixed(2));

      // Update the grand total in the DOM
      $('.gtotal').text('₹  ' + result.grandTotal.toFixed(2));
    },
    error: function(err) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: err.responseJSON.message,
      });
    }
  });
});


// Client-side code
function applyCoupon(event) {
  event.preventDefault();

  const couponCode = document.getElementById('couponCode').value;

  fetch('/applyCoupon', {
      method: 'PUT',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: couponCode }),
  })
  .then(response => {
    if (!response.ok) {
      // If the response status is not ok (like 400 or 500), throw an error
      throw response;
    }
    return response.json();
  })
  .then(data => {
      // Update the values on the page
      document.querySelector('.priceChange').textContent = '₹ ' + data.originalTotal.toFixed(2);
      document.querySelector('.couponDiscount').textContent = '- ₹ ' + data.couponAmount.toFixed(2);
      document.querySelector('.gtotal').textContent = '₹ ' + data.grandTotal.toFixed(2);

      // Show a success message
      Swal.fire({
        icon: 'success',
        title: 'Coupon applied successfully',
        text: `Your new total is ₹ ${data.grandTotal.toFixed(2)}. You saved ₹ ${data.couponAmount.toFixed(2)}!`
      });
      const removeButton = document.createElement('button');
      removeButton.classList.add('btn', 'btn-danger', 'remove-coupon');
      removeButton.textContent = 'Remove';
      document.querySelector('.couponDiscount').after(removeButton);
  })
  .catch((error) => {
    // If there was an error, get the error message from the JSON response
    error.json().then(errorData => {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: errorData.message
      });
    });
  });
}


function removeCoupon(event) {
  event.preventDefault();

  fetch('/removeCoupon', {
      method: 'PUT',
      headers: {
          'Content-Type': 'application/json',
      },
  })
  .then(response => {
    if (!response.ok) {
      // If the response status is not ok (like 400 or 500), throw an error
      throw response;
    }
    return response.json();
  })
  .then(data => {
      // Update the values on the page
      document.querySelector('.priceChange').textContent = '₹ ' + data.total.toFixed(2);
      document.querySelector('.couponDiscount').textContent = '- ₹ 0.00';
      document.querySelector('.gtotal').textContent = '₹ ' + data.grandTotal.toFixed(2);

      // Show a success message
      Swal.fire({
        icon: 'success',
        title: 'Coupon removed successfully',
        text: `Your new total is ₹ ${data.grandTotal.toFixed(2)}.`
      });

      // Remove the "Remove" button from the DOM
      const removeButton = document.querySelector('.remove-coupon');
      if (removeButton) {
        removeButton.remove();
      }
  })
  .catch((error) => {
    // If there was an error, get the error message from the JSON response
    error.json().then(errorData => {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: errorData.message
      });
    });
  });
}
$(document).on('click', '.remove-coupon', removeCoupon);