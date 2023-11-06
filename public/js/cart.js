const addToCart = productId => {
  // Use addProductToCart() to add the product to the cart
  addProductToCart(productId);
  // Update the product amount in the UI
  updateProductAmount(productId);
};

const decreaseCount = productId => {
  // Decrease the amount of products in the cart using decreaseProductCount()
  const newCount = decreaseProductCount(productId);
  // Update the product amount in the UI
  updateProductAmount(productId);
  // If the count reaches zero, remove the item from the cart and UI
  if (newCount === 0) {
    removeElement('cart-container', `item-row-${productId}`);
  }
};

const updateProductAmount = productId => {
  // Get the product count from the cart
  const productCount = getProductCountFromCart(productId);
  // Update the product amount in the UI
  document.getElementById(`amount-${productId}`).innerText = `${productCount}x`;
};

const placeOrder = async () => {
  // Get all products from the cart
  const cartItems = getAllProductsFromCart();

  // Show a notification for placing the order
  createNotification('Successfully created an order!', 'notifications-container', true);

  // Remove all cart items from the UI and clear the cart
  cartItems.forEach(item => {
    removeElement('cart-container', `item-row-${item.name}`);
  });
  clearCart();
};

(async () => {
  // Get the 'cart-container' element
  const cartContainer = document.getElementById('cart-container');

  // Get the available products
  const products = await getJSON('/api/products');

  // Get all products from the cart
  const cartItems = getAllProductsFromCart();

  // Get the 'cart-item-template' template
  const cartItemTemplate = document.getElementById('cart-item-template');

  // Loop through each item in the cart
  cartItems.forEach(item => {
    // Clone the cart item template
    const cartItemClone = cartItemTemplate.content.cloneNode(true);

    // Get the product information
    const product = products.find(p => p._id === item.name);

    // Set the ID attributes for the cloned elements
    const productId = product._id;
    cartItemClone.querySelector('.item-row').id = `item-row-${productId}`;
    cartItemClone.querySelector('h3').id = `name-${productId}`;
    cartItemClone.querySelector('.product-price').id = `price-${productId}`;
    cartItemClone.querySelector('.product-amount').id = `amount-${productId}`;
    cartItemClone.querySelector('.cart-plus-button').id = `plus-${productId}`;
    cartItemClone.querySelector('.cart-minus-button').id = `minus-${productId}`;

    // Populate product information in the template clone
    cartItemClone.querySelector('h3').textContent = product.name;
    cartItemClone.querySelector('.product-price').textContent = `${(+product.price).toFixed(2)}`;
    cartItemClone.querySelector('.product-amount').textContent = `${item.amount}x`;

    // Add event listeners for plus and minus buttons
    cartItemClone.querySelector('.cart-plus-button').addEventListener('click', () => addToCart(productId));
    cartItemClone.querySelector('.cart-minus-button').addEventListener('click', () => decreaseCount(productId));

    // Append the modified cart item to the cart container
    cartContainer.appendChild(cartItemClone);
  });

  const placeOrderButton = document.getElementById('place-order-button');
  placeOrderButton.addEventListener('click', () => placeOrder())
})();
