<template>
  <div id="app">
    <div class="container">
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
          </li>
        </ul>
        <p v-else-if="empty">0 results</p>
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
    titles: []
  }),
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
  text-align: center;
  color: #2c3e50;
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
  margin-right: 1rem;
  margin-bottom: 1rem;
  border: none;
  background-color: var(--white);
  border: 1px solid var(--blue);
}
button {
  width: 100%;
  padding: 1rem;
  border: none;
  background-color: var(--blue);
  color: var(--white);
  border-radius: var(--border-radius);
}
.results {
  margin-top: 3rem;
}
li {
  padding: 1rem 0;
  text-align: left;
}
</style>
