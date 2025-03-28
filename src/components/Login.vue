<template>
    <div class="login-container">
      <h2>Login</h2>
      <form @submit.prevent="login">
        <div>
          <label for="username">Username:</label>
          <input type="text" v-model="username" />
        </div>
        <div>
          <label for="password">Password:</label>
          <input type="password" v-model="password" />
        </div>
        <button type="submit">Login</button>
      </form>
      <p>Don't have an account? <button @click="goToRegister">Register here</button></p>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    data() {
      return {
        username: '',
        password: ''
      };
    },
    methods: {
      async login() {
        try {
          const response = await axios.post('http://localhost:3000/login', {
            username: this.username,
            password: this.password
          });
  
          const token = response.data.token;
          sessionStorage.setItem('token', token);
          const user = await axios.get('http://localhost:3000/me', {
            headers: { 'x-access-token': token }
          });
  
          if (user.data.role === 'admin') {
            this.$router.push({ path: '/admin', query: { id: user.data.id } });
          } else if (user.data.role === 'main') {
            this.$router.push({ path: '/main', query: { id: user.data.id } });
          } else {
            this.$router.push({ path: '/sub', query: { id: user.data.id } });
          }
        } catch (error) {
          console.error('Login failed:', error);
          alert('Login failed. Please check your credentials and try again.');
        }
      },
      goToRegister() {
        this.$router.push('/register');
      }
    }
  };
  </script>
  