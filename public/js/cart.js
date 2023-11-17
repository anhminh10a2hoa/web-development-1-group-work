const addToCart = productId => {
  // TODO 9.2
  // use addProductToCart(), available already from /public/js/utils.js
  // call updateProductAmount(productId) from this file
  addProductToCart(productId);
  updateProductAmount(productId);
};

const decreaseCount = productId => {
  // TODO 9.2
  // Decrease the amount of products in the cart, /public/js/utils.js provides decreaseProductCount()
  // Remove product from cart if amount is 0,  /public/js/utils.js provides removeElement = (containerId, elementId
  const decreasedAmount = decreaseProductCount(productId)
  updateProductAmount(productId);
  if(decreasedAmount === 0){
    removeElement('cart-container', `amount-${productId}`);
    removeElement('cart-container', `price-${productId}`);
    removeElement('cart-container', `name-${productId}`);
    removeElement('cart-container', `minus-${productId}`);
    removeElement('cart-container', `plus-${productId}`);
    removeElement('cart-container', `item-row-${productId}`);
  }
};

const updateProductAmount = productId => {
  // TODO 9.2
  // - read the amount of products in the cart, /public/js/utils.js provides getProductCountFromCart(productId)
  // - change the amount of products shown in the right element's innerText
  var currentAmount = getProductCountFromCart(productId);
  document.querySelector(`#amount-${productId}`).textContent = currentAmount + 'x';
};

const placeOrder = async() => {
  // TODO 9.2
  // Get all products from the cart, /public/js/utils.js provides getAllProductsFromCart()
  // show the user a notification: /public/js/utils.js provides createNotification = (message, containerId, isSuccess = true)
  // for each of the products in the cart remove them, /public/js/utils.js provides removeElement(containerId, elementId)
  const allProductsFromCart = await getAllProductsFromCart();
  
  try {
    const productArr = new Array();
    allProductsFromCart.forEach((singleProduct) => {
      const productId = singleProduct.name;
      const productElem = {
        "quantity": singleProduct.amount,
        "product": {
          "_id": productId,
          "name": document.getElementById(`name-${productId}`).textContent,
          "price": document.getElementById(`price-${productId}`).textContent,
        }
      }
      productArr.push(productElem);

    });

    await postOrPutJSON('/api/orders', 'POST', {
      "items": productArr
    });

    allProductsFromCart.forEach((singleProduct) => {
      const productId = singleProduct.name;
      removeElement('cart-container', `amount-${productId}`);
      removeElement('cart-container', `price-${productId}`);
      removeElement('cart-container', `name-${productId}`);
      removeElement('cart-container', `description-${productId}`);
      removeElement('cart-container', `minus-${productId}`);
      removeElement('cart-container', `plus-${productId}`);
      removeElement('cart-container', `item-row-${productId}`);
    });
  
    createNotification('Successfully created an order!', 'notifications-container', true);
    clearCart();
  }
  catch(err){
    createNotification('Something went wrong with the order!', 'notifications-container', false);
  }
  
  
};

(async() => {
  // TODO 9.2
  // - get the 'cart-container' element
  // - use getJSON(url) to get the available products
  // - get all products from cart
  // - get the 'cart-item-template' template
  // - for each item in the cart
  //    * copy the item information to the template
  //    * hint: add the product's ID to the created element's as its ID to 
  //        enable editing ith 
  //    * remember to add event listeners for cart-minus-plus-button
  //        cart-minus-plus-button elements. querySelectorAll() can be used 
  //        to select all elements with each of those classes, then its 
  //        just up to finding the right index.  querySelectorAll() can be 
  //        used on the clone of "product in the cart" template to get its two
  //        elements with the "cart-minus-plus-button" class. Of the resulting
  //        element array, one item could be given the ID of 
  //        `plus-${product_id`, and other `minus-${product_id}`. At the same
  //        time we can attach the event listeners to these elements. Something 
  //        like the following will likely work:
  //          clone.querySelector('button').id = `add-to-cart-${prodouctId}`;
  //          clone.querySelector('button').addEventListener('click', () => addToCart(productId, productName));
  //
  // - in the end remember to append the modified cart item to the cart 

  const placeOrderButton = document.getElementById('place-order-button');
  placeOrderButton.addEventListener('click', () => {
    return placeOrder();
  })
  const cartContainer = document.getElementById('cart-container');
  const allProducts = await getJSON('/api/products');
  const cartTemplate = document.getElementById('cart-item-template');
  const allProductsFromCart = await getAllProductsFromCart();

  if (allProductsFromCart.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'No Items in Cart';
    cartContainer.append(p);
    return;
  }
  allProductsFromCart.map(product => {
    const { name: id , amount } = product;
    const productToFind = allProducts.find(singleProduct => singleProduct._id === id);
    const { name, price, description } = productToFind;
    const clone = cartTemplate.content.cloneNode(true);
    clone.querySelector('.item-row').id = `item-row-${id}`;
    clone.querySelector('h3').textContent = name;
    clone.querySelector('h3').id = `name-${id}`;

    clone.querySelector('p.product-price').textContent = price;
    clone.querySelector('p.product-price').id = `price-${id}`;

    
    clone.querySelector('p.product-amount').textContent = amount  + 'x';
    clone.querySelector('p.product-amount').id = `amount-${id}`;

    clone.querySelectorAll('button')[0].id = `plus-${id}`;
    clone.querySelectorAll('button')[1].id = `minus-${id}`;

    clone.querySelectorAll('button')[0].addEventListener('click', () => {
      return addToCart(id);
    })

    clone.querySelectorAll('button')[1].addEventListener('click', () => {
      return decreaseCount(id);
    })
    cartContainer.append(clone);
  })
})();