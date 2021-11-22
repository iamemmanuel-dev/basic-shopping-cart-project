'use strict'
import data from './Data.js'
const btns__container = document.querySelector('.btns__container')
const productsDOM = document.querySelector('.productsDOM')
const close_btn = document.querySelector('.close_btn')
const cart_btn = document.querySelector('.cart_btn')
const cart_container = document.querySelector('.cart_container')
const overlay = document.querySelector('.overlay')
const cartDOM = document.querySelector('.cartDOM')
const navbar__form = document.querySelector('.navbar__form')
const navbar__search_input = document.querySelector('.navbar__search-input')
const cartAmt = document.querySelector('.cartAmt')

let buttonsDOM
let foundArticle

class UI {
  static load_DisplayProducts = (data = Storage.retrieveLocalData()) => {
    let response = ''
    data
      .map(items => {
        const { id, title, img, extras, price } = items
        response += `<article class="card_parent" data-id="${title}">
      <div class="card front__card">
        <div class="like__icon-container">
          <i class="fas fa Reg-Heart like__icon"></i>
        </div>
        <img src="${img}" alt="dish img" />
        <ul>
          <li>${title}</li>
          ${extras
            .map(
              lists => `
          <li>${lists}</li>
          `
            )
            .join('')}
        </ul>
      </div>
      <div class="card back__card">
        <div class="back__card-content">
          <h4>At</h4>
          <h3>$${price}</h3>
          <button class="btn" data-id="${id}">
            order <span class="btn__span">now</span>
          </button>
        </div>
      </div>
    </article>`
      })
      .join('')

    productsDOM.innerHTML = response
    return this
  }

  static loadFilterButtons = () => {
    const categories = [
      'all',
      ...new Set(Storage.retrieveLocalData().map(items => items.category)),
    ]
      .map(
        cate => `
        <div class="categories">
          <input
          type="radio"
          name="category"
          id="${cate}"
          class="radio_btn"
          data-id="${cate}"
          />
          <label for="${cate}">
            <span class="custom__radio"></span>
            ${cate}</label>
        </div> `
      )
      .join('')

    btns__container.innerHTML = categories
    Utils.activateButtonOnLoad()
    return this
  }

  static handleProductsFilter = () => {
    document.querySelectorAll('.radio_btn').forEach(btn => {
      const category = btn.dataset.id
      btn.addEventListener('click', () => {
        const filtered = Storage.retrieveLocalData().filter(
          items => items.category === category
        )

        category === 'all'
          ? this.load_DisplayProducts()
          : this.load_DisplayProducts(filtered)
      })
    })
  }
}

class Cart {
  static handleAddProductsToCart = () => {
    const buttons = [...document.querySelectorAll('.btn')]
    buttonsDOM = buttons
    buttons.forEach(btn => {
      const ID = btn.dataset.id
      Storage.retrieveCart().find(items => items.id === +ID)
        ? Utils.init(btn, 'in cart', true)
        : Utils.init(btn, 'order now', false)
      btn.addEventListener('click', ({ currentTarget }) => {
        Utils.init(currentTarget, 'in cart', true)
        const clickedProduct = Utils.findClickedProduct(ID)
        this.addToCart(clickedProduct).populateCartDOM()
        Utils.updateCartAmount()
      })
    })

    return this
  }

  static addToCart = cartItem => {
    let cartItems = Storage.retrieveCart()
    cartItems = [...cartItems, cartItem]
    Storage.saveCarttoLS(cartItems)
    return this
  }

  static populateCartDOM = () => {
    cartDOM.innerHTML = Storage.retrieveCart()
      .map(items => {
        const { id, img, title, desc, values, price } = items
        return `
      <div class="cartDOM__items">
        <img src="${img}" alt="cart-img" class="cartDOM__img" />
      <div class="cartDOM__info">
        <h3>${title}</h3>
        <p>${desc}</p>
        <div class="cartDOM__subInfo">
          <h4>$${price}</h4>
          <button class="remove" data-id="${id}">remove</button>
          <input
            type="number"
            class="Amt"
            min="1"
            value= "${values[0] || 1}"
            data-id=${id}/>
        </div>
      </div>
    </div>`
      })
      .join('')

    this.handleCartItemsFilter()
    this.handleCartItemCount()
    return this
  }

  static handleCartItemsFilter = () => {
    document.querySelectorAll('.remove').forEach(btn => {
      const ID = btn.dataset.id
      btn.addEventListener('click', () => {
        const filtered = Storage.retrieveCart().filter(
          items => items.id !== +ID
        )
        Storage.saveCarttoLS(filtered)
        this.populateCartDOM()
        Utils.updateCartAmount()
        buttonsDOM.find(
          btns => btns.dataset.id == ID && Utils.init(btns, 'order now', false)
        )
      })
    })
  }

  static handleCartItemCount = () => {
    document.querySelectorAll('.Amt').forEach(inp => {
      const ID = inp.dataset.id
      inp.addEventListener('focusout', e => {
        const { value } = e.currentTarget
        const updated = Storage.retrieveCart().map(items =>
          items.id === parseInt(ID) ? { ...items, values: [value] } : items
        )
        Storage.saveCarttoLS(updated)
        this.populateCartDOM()
      })
    })
  }
}

class Storage {
  static saveProductsToLS = data =>
    localStorage.setItem('data', JSON.stringify(data))

  static retrieveLocalData = () =>
    localStorage.getItem('data') ? JSON.parse(localStorage.getItem('data')) : []

  static saveCarttoLS = cart =>
    localStorage.setItem('cart', JSON.stringify(cart))

  static retrieveCart = () =>
    localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : []
}

class Utils {
  static activateButtonOnLoad = () =>
    (document.getElementById('all').checked = true)

  static init = (el, text, bool) => {
    el.textContent = text
    el.disabled = bool
  }

  static findClickedProduct = id =>
    Storage.retrieveLocalData().find(items => items.id === +id)

  static updateCartAmount = () => {
    cartAmt.textContent = Storage.retrieveCart().length
    return this
  }

  static toggleCartDOM = () => {
    cart_btn.addEventListener('click', () => {
      overlay.classList.add('show_overlay')
      cart_container.classList.add('show_cart')
    })

    close_btn.addEventListener('click', () => {
      overlay.classList.remove('show_overlay')
      cart_container.classList.remove('show_cart')
    })
  }
}

window.addEventListener(`load`, () => {
  Utils.updateCartAmount().toggleCartDOM()
  Storage.saveProductsToLS(data)
  UI.load_DisplayProducts().loadFilterButtons().handleProductsFilter()
  Cart.handleAddProductsToCart().populateCartDOM()
})

navbar__form.addEventListener(`submit`, e => {
  e.preventDefault()
  const { value } = navbar__search_input
  foundArticle = [...productsDOM.children].find(articles =>
    articles.dataset.id.includes(value)
  )

  foundArticle.scrollIntoView({ behavior: `smooth` })
  foundArticle.classList.add('found_item')
})

document.body.addEventListener(`click`, () => {
  foundArticle?.classList.remove(`found_item`)
})
