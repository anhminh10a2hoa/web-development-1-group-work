(async() => {
    const ordersContainer = document.getElementById('orders-container');
    const orderTemplate = document.getElementById('order-item-template');
    const orders = await getJSON('/api/orders');

    orders.forEach(e => {
        const clone = orderTemplate.content.cloneNode(true);
        const title = clone.querySelector('h3');
        title.textContent = `Order ${e._id}`;
        
        const table = clone.getElementById('orders-table').querySelector('tbody');

        let totalQuantity = 0;
        let totalPrice = 0;

        e.items.forEach(item => {
            const tr = document.createElement('tr');
            const productTd = document.createElement('td');
            const quantityTd = document.createElement('td');
            const priceTd = document.createElement('td');
            productTd.textContent = item.product.name;
            quantityTd.textContent = item.quantity;
            priceTd.textContent = item.product.price;                        

            tr.append(productTd);
            tr.append(quantityTd);
            tr.append(priceTd);
            table.append(tr);
            
            totalQuantity += parseInt(item.quantity);
            totalPrice += (parseInt(item.quantity) * item.product.price);
        })

        const trTotal = document.createElement('tr');
        const descTotal = document.createElement('td');
        const quantityTotal = document.createElement('td');
        const priceTotal = document.createElement('td');

        descTotal.textContent = "Total";
        quantityTotal.textContent = totalQuantity;
        priceTotal.textContent = totalPrice;
        trTotal.append(descTotal);
        trTotal.append(quantityTotal);
        trTotal.append(priceTotal);
        table.append(trTotal);

        ordersContainer.append(clone);
    });

})();