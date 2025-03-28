<template>
  <div id="app">
    <nav>
      <button v-if="isSub" @click="editprofile()">Edit Profile</button>
      <button v-if="isLoggedIn" @click="logout()">Logout</button>
    </nav>
    <router-view></router-view>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      isLoggedIn: !!sessionStorage.getItem('token'),
      isSub: false
    };
  },
  methods: {
    checkLogin() {
      this.isLoggedIn = !!sessionStorage.getItem('token'); // check if user is logged in
    },
    checkSubLogin() {
      const token = sessionStorage.getItem('token'); // get token from local storage
      if (token) {
        axios.get('http://localhost:3000/me', { headers: { 'x-access-token': token } })
          .then(response => {
            if (response.data.role === 'sub') {
              this.isSub = true;
            }
          })
          .catch(error => {
            console.error('Error:', error);
          });
      }
    },
    logout() {
      sessionStorage.removeItem('token'); // remove token from local storage
      this.isLoggedIn = false;
      this.isSub = false;
      this.$router.push('/'); // redirect to login page
    },
    editprofile() {
      const userid = this.$route.query.id; // get user id from route params
      console.log(userid);
      this.$router.push({path: '/editprofile', query: {id: userid}}); // redirect to edit profile page
    }
  },
  watch: {
    $route() {
      this.checkLogin(); // check login status when route changes
      this.checkSubLogin(); // check if user is a sub user
    }
  },
};
</script>

<style>
/* add some basic style */
nav {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background-color: #333;
  padding: 10px;
  text-align: right;
}

button {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 10px;
  cursor: pointer;
}

button:hover {
  background-color: #d32f2f;
}
</style>
