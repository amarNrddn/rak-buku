document.addEventListener('DOMContentLoaded', main)

function main() {
    const bookInputForm = getBookInputForm()
    const searchForm = getSearchForm()

    // Kembalikan buku dari penyimpanan
    renderBookShelfElements(BookStorage.getAll())

    // Kembalikan buku dari penyimpanan
    bookInputForm.container.addEventListener('submit', (e) => {
        e.preventDefault()
        if (!bookInputForm.inputBookId.value) {
            const book = generateBookTemplate()
            book.title = bookInputForm.inputTitle.value
            book.author = bookInputForm.inputAuthor.value
            book.year = bookInputForm.inputYear.value
            book.isComplete = bookInputForm.checkBoxIsComplete.checked
            BookStorage.set(book)
            renderBookShelfElements(BookStorage.getAll())
            bookInputForm.container.reset()
        }
    })    

    // Toogle kirim teks berdasarkan buku masukan
    bookInputForm.checkBoxIsComplete.addEventListener('change', (e) => {
        const submitSpanText = bookInputForm.buttonSubmit.querySelector('span')
        if (e.target.checked) {
            submitSpanText.innerText = 'Selesai dibaca'
        } else {
            submitSpanText.innerHTML = 'Belum selesai dibaca'
        }
    })

    // Cari buku berdasarkan judul 
    searchForm.container.addEventListener('submit', (e) => {
        e.preventDefault()
        const searchInput = searchForm.inputQuery
        const searchResult = BookStorage.getAll({ name: searchInput.value })
        renderBookShelfElements(searchResult)
    })
}

const BookStorage = {
    _books: [],
    _STORAGE_KEY: 'BOOKS_STORAGE',

    getAll:  function({ name } = {}) {
        if (isStorageExists()) {
            const storageData = localStorage.getItem(this._STORAGE_KEY)
            this._books = JSON.parse(storageData) || []
        }

        if (name) {
            return this._books.filter(book => book.title.toLowerCase().includes(name.toLowerCase()))
        }
        
        return this._books
    },

    set: function(book) {
        const books = this.getAll()
        const isBookExists = books.find(b => b.id === book.id)

        if (isBookExists) {
            const index = books.findIndex(b => b.id === book.id)
            books[index] = book
        } else {
            this._books.push(book)
        }

        if (isStorageExists()) {
            localStorage.setItem(this._STORAGE_KEY, JSON.stringify(this._books))
        }
    },

    delete: function(id) {
        this._books = this._books.filter(book => book.id !== id)
        if (isStorageExists()) {
            localStorage.setItem(this._STORAGE_KEY, JSON.stringify(this._books))
        }
    }
}

function generateBookTemplate() {
    return {
        id: +new Date(),
        title: '',
        author: '',
        year: 0,
        isComplete: false
    }
}

function isStorageExists() {
    if (typeof Storage !== 'undefined') {
        return true
    }
    console.log('This browser does not support local storage')
    return false
}

function getBookInputForm() {
    return {
        container: document.querySelector('#inputBook'),
        inputBookId: document.querySelector('#inputBookId'),
        inputTitle: document.querySelector('#inputBookTitle'),
        inputAuthor: document.querySelector('#inputBookAuthor'),
        inputYear: document.querySelector('#inputBookYear'),
        checkBoxIsComplete: document.querySelector('#inputBookIsComplete'),
        buttonSubmit: document.querySelector('#bookSubmit')
    }
}

function getSearchForm() {
    return {
        container: document.querySelector('#searchBook'),
        inputQuery: document.querySelector('#searchBookTitle')
    }
}

function generateBookshelfElement(book) {
    const container = document.createElement('article')
    const heading = document.createElement('h3')
    const author = document.createElement('p')
    const year = document.createElement('p')
    const action = document.createElement('div')
    const completeButton = document.createElement('button')
    const editButton = document.createElement('button')
    const deleteButton = document.createElement('button')
    
    container.classList.add('book_item')
    action.classList.add('action')
    completeButton.classList.add('green')
    editButton.classList.add('gray')
    deleteButton.classList.add('red')

    heading.innerText = book.title
    author.innerText = `Penulis: ${book.author}`
    year.innerText = `Tahun: ${book.year}`
    if (book.isComplete) {
        completeButton.innerText = 'Belum selesai dibaca'
    } else {
        completeButton.innerText = 'Selesai dibaca'
    }
    editButton.innerText = 'Edit buku'
    deleteButton.innerText = 'Hapus buku'

    // Pindah ke selesai 
    completeButton.onclick = () => {
        book.isComplete = !book.isComplete
        BookStorage.set(book)
        renderBookShelfElements(BookStorage.getAll())
    }

    // Edit buku
    editButton.onclick = () => {
        const bookInputForm = getBookInputForm()
        bookInputForm.inputBookId.value = book.id
        bookInputForm.inputTitle.value = book.title
        bookInputForm.inputAuthor.value = book.author
        bookInputForm.inputYear.value = book.year
        bookInputForm.checkBoxIsComplete.checked = book.isComplete
        bookInputForm.checkBoxIsComplete.dispatchEvent(new Event('change'))
        window.scrollTo(0, 0)

        const performEdit = (e) => {
            e.preventDefault()
            if (bookInputForm.inputBookId.value) {
                const book = generateBookTemplate()
                book.id = Number(bookInputForm.inputBookId.value)
                book.title = bookInputForm.inputTitle.value
                book.author = bookInputForm.inputAuthor.value
                book.year = bookInputForm.inputYear.value
                book.isComplete = bookInputForm.checkBoxIsComplete.checked

                BookStorage.set(book)
                renderBookShelfElements(BookStorage.getAll())
                bookInputForm.container.reset()
                bookInputForm.inputBookId.value = ''
            }
            bookInputForm.container.removeEventListener('submit', performEdit)
        }

        bookInputForm.container.addEventListener('submit', performEdit)
    }

    // Delete buku
    deleteButton.onclick = () => {
        const bookInputForm = getBookInputForm()
        bookInputForm.inputBookId.value = ''
        bookInputForm.container.reset()
        
        DialogDeleteBook.show()
        DialogDeleteBook.observeResponse((response) => {
            if (response) {
                BookStorage.delete(book.id)
                renderBookShelfElements(BookStorage.getAll())
            }
        })
    }

    action.append(completeButton, editButton, deleteButton)
    container.append(heading, author, year, action)
    return container
}

function renderBookShelfElements(books) {
    const completeListContainer = document.querySelector('#completeBookshelfList')
    const incompleteListContainer = document.querySelector('#incompleteBookshelfList')

    // Remove all comlite list
    while (completeListContainer.hasChildNodes()) {
        completeListContainer.removeChild(completeListContainer.firstChild)
    }
    
    // Remove all from incomplete list
    while (incompleteListContainer.hasChildNodes()) {
        incompleteListContainer.removeChild(incompleteListContainer.firstChild)
    }

    // Render complete and incomplete element list
    books.forEach(book => {
        if (book.isComplete) {
            completeListContainer.append(generateBookshelfElement(book))
        } else {
            incompleteListContainer.append(generateBookshelfElement(book))
        }
    });
}

const DialogDeleteBook = { 
    _container: document.querySelector('#dialogDeleteBook'),

    show: function() {
        this._container.classList.add('show')
    },

    hide: function() {
        this._container.classList.remove('show')
    },

     observeResponse: function(callback) {
        const buttonConfirm = this._container.querySelector('.button_confirm')
        const buttonCancel = this._container.querySelector('.button_cancel')
        
        buttonConfirm.onclick = () => {
            callback(true)
            this.hide()
        }

        buttonCancel.onclick = () => {
            callback(false)
            this.hide()
        }
    },
}