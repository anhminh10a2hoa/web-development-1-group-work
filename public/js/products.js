const addToCart = (productId, productName) => {
  // Add the product to the shopping cart using addProductToCart() function
  addProductToCart(productId);

  // Show a success notification
  createNotification(`Added ${productName} to cart!`, 'notifications-container', true);
};

(async () => {
  // Get the 'products-container' element and the 'product-template' element
  const productsContainer = document.getElementById('products-container');
  const productTemplate = document.getElementById('product-template');

  // Get all the products using the getJSON function
  const products = await getJSON('/api/products');
  // Loop through the products and populate the product list
  products.forEach(product => {
    // Clone the product template
    const productClone = productTemplate.content.cloneNode(true);

    // Set the id attributes for the cloned elements
    const productId = product._id;
    productClone.querySelector(`h3`).id = `name-${productId}`;
    productClone.querySelector('.product-description').id = `description-${productId}`;
    productClone.querySelector('.product-price').id = `price-${productId}`;
    productClone.querySelector('.add-to-cart').id = `add-to-cart-${productId}`;

    // Populate product information in the template clone
    productClone.querySelector(`h3`).textContent = product.name;
    productClone.querySelector('.product-description').textContent = product.description;
    productClone.querySelector('.product-price').textContent = `${(+product.price).toFixed(2)}`;

    // Add an event listener to the "Add to cart" button
    productClone.querySelector('.add-to-cart').addEventListener('click', () => {
      addToCart(productId, product.name);
    });
    // Append the product clone to the products container
    productsContainer.appendChild(productClone);
  });
})();
