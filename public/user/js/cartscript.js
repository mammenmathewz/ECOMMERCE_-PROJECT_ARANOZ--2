$(document).on('click', '.remove-from-cart', function(e) {
  e.preventDefault();

  const productId = $(this).data('id');
  const itemElement = $(this).closest('.row'); // Get the closest parent element with the class 'row'

  $.ajax({
    url: '/removeFromCart/' + productId,
    type: 'DELETE',
    success: function(result) {
      // Remove the item from the DOM
      itemElement.remove();

      // Update the total price in the DOM
      $('.priceChange').text('€ ' + result.total.toFixed(2));

      // Update the number of items in the cart
      const itemCount = result.items.length;
      $('.d-flex.justify-content-between.align-items-center.mb-5 h6').text(itemCount + ' items');
      $('.d-flex.justify-content-between.mb-4 h3').text('Items in cart: ' + itemCount);
    
    },
    error: function(err) {
      console.error(err);
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
      $('.priceChange').text('€ ' + result.total.toFixed(2));
    },
    error: function(err) {
      console.error(err);
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
      $('.priceChange').text('€ ' + result.total.toFixed(2));
    },
    error: function(err) {
      console.error(err);
    }
  });
});
