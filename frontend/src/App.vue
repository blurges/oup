<template>
  <div id="app">
    <div class="container">
      <h1>Oxford University Press Book Catalogue</h1>
      <form @submit.prevent="search()">
        <label for="search">Search book titles</label>
        <input
          id="search"
          class="input"
          type="text"
          autofocus
          placeholder="Great Expectations"
          required
          :disabled="loading"
          v-model="optional.search"
        >
        <button
          type="submit"
          class="button wide"
          @keyup.enter="search()"
          :disabled="loading"
        >{{loading ? 'Loading' : 'Search' }}</button>
      </form>
      <div class="results" v-if="!loading">
        <p v-if="errored">Something went wrong. We're sorry.</p>
        <ul v-else-if="titles.length">
          <li v-for="(title, index) in titles" :key="index">
            <p v-if="title.titleshort">
              <strong>{{title.titleshort._text}}</strong>
            </p>
            <p v-if="title.author">{{title.author._text}}</p>
            <p v-if="title.isbn">ISBN {{title.isbn._text}}</p>
            <p
              v-if="title.pages"
            >{{formatNumber(title.pages._text)}} page{{title.pages._text === '1' ? '' : 's'}}</p>
            <div class="actions">
              <button
                type="button"
                class="button"
                @click="details(title, index)"
                :ref="'details' + index"
              >Details</button>
              <button
                type="button"
                @click.stop="bookmark(title)"
                class="bookmark"
                :class="{'marked' : isBookmarked(title)}"
                :aria-label="bookmarkLabel(title)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" height="100%" viewBox="0 0 26 37">
                  <desc>Bookmark</desc>
                  <path
                    class="background"
                    fill-rule="evenodd"
                    stroke="#000"
                    d="M4.3915094.5C2.2937264.5.5 2.024434.5 4.0023585V34.356132c0 .447783.10117924 1.019575.54740566 1.447123.44570755.427547.98688674.498632 1.39834904.498632.2308962-.0042.4540095-.07524.644434-.20651l9.8626413-6.579245 9.862642 6.579245c.190424.131274.413537.202359.644434.20651.411462 0 .952641-.07109 1.398349-.498632.446226-.427548.547405-.99934.547405-1.447123V4.0023585C25.40566 2.024434 23.611934.5 21.514151.5z"/>
                </svg>
              </button>
            </div>
          </li>
        </ul>
        <p v-else-if="empty">0 results</p>
      </div>
    </div>
    <div class="dialog-backdrop" :class="{'active' : modal}">
      <div
        role="dialog"
        id="dialog"
        aria-labelledby="dialog_label"
        aria-modal="true"
        class="dialog"
        tabindex="0"
        ref="modal"
      >
        <h2 id="dialog_label" v-if="preview.titleshort">{{preview.titleshort._text}}</h2>
        <p v-if="preview.flapcopy" v-html="preview.flapcopy._text"></p>
        <button @click.stop="close()" class="button">Close</button>
      </div>
    </div>
  </div>
</template>

<script>
const convert = require('xml-js')

export default {
  name: 'app',
  data: () => ({
    api: {
      corsBypass: 'https://cors-anywhere.herokuapp.com/',
      url: 'https://reststop.randomhouse.com/resources/titles?',
      username: 'testuser',
      passwod: 'testpassword'
    },
    optional: {
      // optional
      onsaleStart: '', // MM/dd/yyyy
      onsaleEnd: '',
      ageRangeCodes: '', // '0512' -- ages five to twelve, '10UP,0812' -- ages 10 and up or eight to twelve
      division: '', // '70' -- Penguin Random House Group, '72' -- RH Childrens Books
      imprint: '', // '1A' -- Bantam, 'K1' -- Knopf Books for Young Readers
      format: '', // HC' -- Hardcover, 'MM' -- Paperback, 'EL' -- eBook
      authorid: 0, // 3446
      workid: '', // 19309 - used to get different formats of a previously found title
      workFamily: '', // modifies 'workid' search to limit the types of results that are returned: 'P', 'R', 'P,R'
      search: '', // exact match of a word in the keyword field, a concatenation of the basic metadata plus some blurb text
      theme: '' // case insensitive match of all or a portion of one of the theme categories assigned to a title
    },
    errored: false,
    loading: false,
    empty: false,
    titles: [],
    modal: false,
    preview: {
      titlesubtitleauthisbn: {}
    },
    bookmarks: []
  }),
  created () {
    this.fetchBookmarks()
  },
  methods: {
    search (start = 0, max = 50) {
      this.errored = false
      this.loading = true
      this.empty = false
      this.titles = []

      // using a proxy because response does not have the "Access-Control-Allow-Origin" header
      let url = new URL(this.api.corsBypass + this.api.url)
      url.searchParams.append('expandLevel', 1)
      url.searchParams.append('start', start)
      url.searchParams.append('max', max)
      Object.keys(this.optional).forEach(key => {
        if (this.optional[key]) {
          url.searchParams.append(key, this.optional[key])
        }
      })
      fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${btoa(
            `${this.api.testuser}:${this.api.testpassword}`
          )}`
        }
      })
        .then(response => response.text())
        .then(response =>
          convert.xml2json(response, { compact: true, spaces: 4 })
        )
        .then(response => {
          response = JSON.parse(response)
          if (!response.titles || !response.titles.title) {
            this.empty = true
            return
          }
          this.titles = response.titles.title
        })
        .catch(reason => {
          this.errored = true
        })
        .finally(() => {
          this.loading = false
        })
    },
    formatNumber (value) {
      try {
        let input = Number(value)
        if (isNaN(input)) return value
        input = input.toLocaleString('en-US', {
          style: 'decimal',
          maximumFractionDigits: 0
        })
        return input
      } catch (e) {
        return value
      }
    },
    details (title, index) {
      this.preview = {
        ...title,
        index
      }
      this.modal = true
      this.$nextTick(function () {
        this.$refs.modal.focus()
      })
    },
    close () {
      this.$refs[`details${this.preview.index}`][0].focus()
      this.modal = false
      this.preview = {
        titlesubtitleauthisbn: {}
      }
    },
    fetchBookmarks () {
      fetch('http://localhost:3000', {
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(response => {
          this.bookmarks = response.map(bookmark => bookmark.isbn)
        })
        .catch(reason => {
          window.alert('Failed to fetch bookmarks. Check the console for error output.')
          console.log('Failed to fetch bookmarks', { reason })
        })
    },
    addBookmark (title) {
      fetch('http://localhost:3000', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isbn: title.isbn._text })
      })
        .catch(reason => {
          window.alert('Failed to bookmark. Check the console for error output.')
          console.log('Failed to fetch bookmark', { reason })
        })
        .finally(() => this.fetchBookmarks())
    },
    removeBookmark (title) {
      fetch('http://localhost:3000', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isbn: title.isbn._text })
      })
        .catch(reason => {
          window.alert('Failed to bookmark. Check the console for error output.')
          console.log('Failed to fetch bookmark', { reason })
        })
        .finally(() => this.fetchBookmarks())
    },
    bookmark (title) {
      // optimistic UI
      if (this.isBookmarked(title)) {
        this.bookmarks = this.bookmarks.filter(
          bookmark => title.isbn._text !== bookmark
        )
        this.removeBookmark(title)
      } else {
        this.bookmarks.push(title.isbn._text)
        this.addBookmark(title)
      }
    },
    bookmarkLabel (title) {
      if (this.isBookmarked(title)) {
        return 'remove bookmark'
      } else {
        return 'bookmark'
      }
    },
    isBookmarked (title) {
      return this.bookmarks.includes(title.isbn._text)
    }
  }
}
</script>

<style scoped>
#app {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  font-size: 18px;
  line-height: 1.5;
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

h1 {
  font-size: 150%;
}
.container {
  width: 100%;
  max-width: 50rem;
  display: flex;
  flex-direction: column;
}

label {
  display: block;
  margin-top: calc(1rem);
  margin-bottom: calc(1rem);
}
form {
  align-self: center;
  width: 100%;
  max-width: 50rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.input {
  width: 100%;
  padding: 1rem;
  border: none;
  background-color: var(--white);
  border: 1px solid var(--blue);
}
.actions {
  display: flex;
  align-items: center;
}
.button {
  margin-top: 1rem;
  padding: 1rem;
  border: none;
  background-color: var(--blue);
  color: var(--white);
  border-radius: var(--border-radius);
}
.button.wide {
  width: 100%;
}
.bookmark {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
  height: 4rem;
  width: 4rem;
  margin-left: 1rem;
  border: none;
  background-color: var(--white);
}

.bookmark .background {
  fill: var(--white);
}

.bookmark.marked .background {
  fill: var(--blue);
}

.results {
  margin-top: 3rem;
}
li {
  margin-top: 1rem;
  padding: 1rem 0;
  text-align: left;
}

.details {
  margin-top: 1rem;
  padding: 1rem;
  border: none;
  background-color: var(--blue);
  color: var(--white);
  border-radius: var(--border-radius);
}
.dialog-backdrop {
  display: none;
  position: fixed;
  overflow-y: auto;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.3);
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.dialog-backdrop.active {
  display: flex;
}
.dialog {
  width: 100%;
  max-width: 50rem;
  margin: 2rem;
  padding: 1rem;
  background-color: var(--white);
}
</style>
