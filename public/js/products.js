

(async() => {
  //TODO 9.2 
  // - get the 'products-container' element from the /products.html
  // - get the 'product-template' element from the /products.html
  // - save the response from await getJSON(url) to get all the products. getJSON(url) 
  // is available to this script in 
  // products.html, as "js/utils.js" script has been added to products.html before this script file 
  // - then, loop throug the products in the response, and for each of the products:
  //    * clone the template
  //    * add product information to the template clone
  //    * remember to add an event listener for the button's 'click' event, and call 
  //      addToCart() in the event listener's callback
  // - remember to add the products to the the page
  const productsContainer = document.getElementById('products-container');
  const productTemplate = document.getElementById('product-template');
  const formTemplate = document.querySelector('#form-template');
  const modifyContainer = document.querySelector('#modify-product');
  const addNewButton = document.getElementById('add-product');

  const refresh = async () => {    
  
    const allProducts = await getJSON('/api/products');
    productsContainer.innerHTML = "";
    allProducts.map(product => {
      const id = product._id;
      const clone = productTemplate.content.cloneNode(true);
      const name = clone.querySelector('h3');
      const des = clone.querySelector('p.product-description');
      const price = clone.querySelector('p.product-price');
      const button = clone.getElementById('add-to-cart');
      const modifyButton = clone.getElementById('modify-product');
      const deleteButton = clone.getElementById('delete-product');
      name.textContent = product.name;
      name.id = `name-${id}`;
  
      des.textContent = product.description;
      des.id = `description-${id}`;
  
      price.textContent = product.price;
      price.id = `price-${id}`;
  
      button.id = `add-to-cart-${product._id}`;
      button.classList.add('addToCart-button');
      button.addEventListener('click', (event) => {
        event.preventDefault();
        addToCart(product._id, product.name);
      })
  
      modifyButton.id = `modify-${product._id}`;
      modifyButton.classList.add('modify-button');
      modifyButton.addEventListener('click', (event) => {
        event.preventDefault();
        modify(product._id);
      });
  
      deleteButton.id = `delete-${product._id}`;
      deleteButton.classList.add('modify-button');
      deleteButton.addEventListener('click', (event) => {
        event.preventDefault();
        deleteProduct(product._id);
      });
  
      productsContainer.append(clone);
    });

    
    
    try {
      // bit of a "hack" to see if user is an admin. In this case show add,modify and delete buttons for products
      await getJSON('/api/users'); //This gives 403 forbidden if user is customer, so in this case we go to catch() 

      const modifyButtons = document.getElementsByClassName('modify-button');
      const deleteButtons = document.getElementsByClassName('modify-button');
      document.getElementById('add-product').hidden = false;
      modifyButtons.forEach(button => {
        button.hidden = false;
      });
      deleteButtons.forEach(button => {
        button.hidden = false;
      });
    }
    catch(error){
      // Not admin user
    }
    
    
  }


  addNewButton.addEventListener('click', (event) => {
    event.preventDefault();
    addNewProduct();
  })

  const addToCart = (productId, productName) => {
    // TODO 9.2
    // you can use addProductToCart(), available already from /public/js/utils.js
    // for showing a notification of the product's creation, /public/js/utils.js  includes createNotification() function
    
    createNotification(`Added ${productName} to cart!`, 'notifications-container', true);
    addProductToCart(productId);
    
  };

  const addNewProduct = async () => {
    showAddForm();
  };
  
  const modify = async (productId) => {
    const product = await getJSON(`/api/products/${productId}`)
    showEditForm(product._id, product.name, product.price, product.description);
    window.scrollTo(0, 0);
  };
  
  const deleteProduct = async (productId) => {
    try {
      const product = await deleteResource(`/api/products/${productId}`);
      createNotification(`Deleted product ${product.name}`, 'notifications-container');
      await refresh();
    }
    catch(err){
      createNotification('Failed to delete the product!', 'notifications-container', false);
    }
    
  };
  
  const showEditForm = (id, name, price, description) => {
    removeElement('modify-product', 'edit-product-form');

    const form = formTemplate.content.cloneNode(true);
    form.querySelector('h2').textContent = `Modify product ${name}`;
    form.querySelector('#id-input').value = id;
    form.querySelector('#name-input').value = name;
    form.querySelector('#price-input').value = price;
    form.querySelector('#description-input').value = description;
  
    modifyContainer.append(form);
    modifyContainer.querySelector('form').addEventListener('submit', updateProduct);
  };

  const showAddForm = () => {
    removeElement('modify-product', 'edit-product-form');

    const form = formTemplate.content.cloneNode(true);
    form.querySelector('h2').textContent = `Add new product`;      
  
    modifyContainer.append(form);
    document.getElementById('edit-product-form').children[1].remove(); // Remove the id field
    modifyContainer.querySelector('form').addEventListener('submit', addNewProductAPI);
  };  
  
  const updateProduct = async event => {
    event.preventDefault();
    const form = event.target;
    const id = form.querySelector('#id-input').value;
    const name = form.querySelector('#name-input').value;
    const price = form.querySelector('#price-input').value;
    const description = form.querySelector('#description-input').value;
  
    try {
      const product = await postOrPutJSON(`/api/products/${id}`, 'PUT', {
        "name": name,
        "price": price,
        "description": description
      });

      document.querySelector(`#name-${id}`).textContent = product.name;
      document.querySelector(`#price-${id}`).textContent = product.price;
      document.querySelector(`#description-${id}`).textContent = product.description;
      removeElement('modify-product', 'edit-product-form');
      createNotification(`Updated product ${product.name}`, 'notifications-container');
    }
    catch(error){
      createNotification('Updating failed!', 'notifications-container', false);
    }
  }

  const addNewProductAPI = async event => {
    event.preventDefault();
    const form = event.target;
    const name = form.querySelector('#name-input').value;
    const price = form.querySelector('#price-input').value;
    const description = form.querySelector('#description-input').value;

    try {
      const product = await postOrPutJSON('/api/products', 'POST', {
        "name": name,
        "price": price,
        "description": description,
        "image": "image"
      });
      removeElement('modify-product', 'edit-product-form');
      createNotification(`Product ${product.name} added succesfully`, 'notifications-container');
      await refresh();
    }
    catch(error){
      createNotification('Failed adding the product. Check the inputs', 'notifications-container', false)
    }
  }

  await refresh();

})();
