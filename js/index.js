const btnCart = document.querySelector('.button-cart'),
    modalCart = document.querySelector('#modal-cart'),
    btnMore = document.querySelector('.more'),
    navigationLinks = document.querySelectorAll('.navigation-link'),
    longGoodsList = document.querySelector('.long-goods-list'),
    btnAllGoods = document.querySelector('.all-goods'),
    cartTableGoods = document.querySelector('.cart-table__goods'),
    cartTableTotal = document.querySelector('.card-table__total'),
    showAllAcsessories = document.querySelectorAll('.show-all-acsessories'),
    showAllClothing = document.querySelectorAll('.show-all-clothing');

// getGoods
const getGoods = async () => {
    const result = await fetch('db/db.json');
    if (!result.ok) {
        throw new Error('Error: ' + result.status);
    }
    return await result.json();
};

// cart
const cart = {
    cartGoods: [],
    renderCart() {
        cartTableGoods.textContent = '';
        this.cartGoods.forEach(({ id, name, price, count }) => {
            const trGood = document.createElement('tr');
            trGood.className = 'cart-item';
            trGood.dataset.id = id;

            trGood.innerHTML = `
            <td>${name}</td>
            <td>${price}$</td>
            <td><button class="cart-btn-minus">-</button></td>
            <td>${count}</td>
            <td><button class="cart-btn-plus">+</button></td>
            <td>${price * count}$</td>
            <td><button class="cart-btn-delete">x</button></td>
        `;

            cartTableGoods.append(trGood);
        })

        const totalPrice = this.cartGoods.reduce((sum, item) => {
            return sum + item.price * item.count;
        }, 0);

        cartTableTotal.textContent = totalPrice + '$';
    },
    deleteGood(id) {
        this.cartGoods = this.cartGoods.filter(item => id !== item.id);
        this.renderCart();
    },
    minusGood(id) {
        for (const item of this.cartGoods) {
            if (item.id === id) {
                if (item.count < 1) {
                    this.deleteGood(id);
                } else {
                    item.count--;
                }
                break;
            }
        }
        this.renderCart();
    },
    plusGood(id) {
        for (const item of this.cartGoods) {
            if (item.id === id) {
                item.count++;
                break;
            }
        }
        this.renderCart();
    },
    addGoodInCart(id) {
        const goodItem = this.cartGoods.find(item => item.id === id);
        if (goodItem) {
            this.plusGood(id);
        } else {
            getGoods()
                .then(data => data.find(item => item.id === id))
                .then(({ id, name, price }) => {
                    this.cartGoods.push({
                        id,
                        name,
                        price,
                        count: 1,
                    });
                });
        }
    },
};

document.body.addEventListener('click', event => {
    const addToCart = event.target.closest('.add-to-cart');

    if (addToCart) {
        cart.addGoodInCart(addToCart.dataset.id);
    }
});

const openCart = () => {
    cart.renderCart();
    modalCart.classList.add('show');
};

const closeCart = () => {
    modalCart.classList.remove('show');
};

cartTableGoods.addEventListener('click', event => {
    const target = event.target;

    if (target.classList.contains('cart-btn-delete')) {
        const parent = target.closest('.cart-item');
        cart.deleteGood(parent.dataset.id);
    }

    if (target.classList.contains('cart-btn-minus')) {
        const parent = target.closest('.cart-item');
        cart.minusGood(parent.dataset.id);
    }

    if (target.classList.contains('cart-btn-plus')) {
        const parent = target.closest('.cart-item');
        cart.plusGood(parent.dataset.id);
    }
});

btnCart.addEventListener('click', openCart);

modalCart.addEventListener('click', event => {
    const target = event.target;
    if (target.classList.contains('modal-close') || target === modalCart) {
        closeCart();
    }
});

// cardGood
const createCard = ({ label, img, name, description, id, price }) => {
    const card = document.createElement('div');
    card.className = 'col-lg-3 col-sm-6';

    card.innerHTML = `
    <div class="goods-card">
        ${label ? `<span class="label">${label}</span>` : ''}
        <img src="db/${img}" alt="${name}" class="goods-image">
        <h3 class="goods-title">${name}</h3>
        <p class="goods-description">${description}</p>
        <button class="button goods-card-btn add-to-cart" data-id="${id}">
            <span class="button-price">$${price}</span>
        </button>
    </div>
`;

    return card;
};

const renderCards = data => {
    longGoodsList.textContent = '';
    const cards = data.map(createCard);
    longGoodsList.append(...cards);

    document.body.classList.add('show-goods');
};

btnMore.addEventListener('click', event => {
    event.preventDefault();
    getGoods().then(renderCards);
});

const filterGoods = (field, value) => {
    getGoods()
        .then(data => data.filter(good => good[field] === value))
        .then(renderCards);
};

navigationLinks.forEach(link => {
    link.addEventListener('click', event => {
        event.preventDefault();
        const field = link.dataset.field;
        const value = link.textContent;
        filterGoods(field, value);
    })
});

btnAllGoods.addEventListener('click', event => {
    event.preventDefault();
    getGoods().then(renderCards);
})

showAllAcsessories.forEach(item => {
    item.addEventListener('click', event => {
        event.preventDefault();
        filterGoods('category', 'Accessories');
    });
});

showAllClothing.forEach(item => {
    item.addEventListener('click', event => {
        event.preventDefault();
        filterGoods('category', 'Clothing');
    });
});

// server
const modalForm = document.querySelector('.modal-form');

const postData = dataUser => fetch('server.php', {
    method: 'POST',
    body: dataUser,
});

modalForm.addEventListener('submit', event => {
    event.preventDefault();

    const formData = new FormData(modalForm);
    formData.append('good', JSON.stringify(cart.cartGoods));
    postData(formData)
        .then(response => {
            if (!response.ok) {
                throw new Error(response.status);
            } else {
                alert('Your order has been accepted, we will contact you shortly');
                console.log(response.statusText);
            }
        })
        .catch(err => {
            alert('Server error, try later!');
            console.error(err);
        })
        .finally(() => {
            closeCart();
            modalForm.reset();
            cart.cartGoods.length = 0;
        });
});