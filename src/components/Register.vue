<template>
  <div class="register-container">
    <h2>Register as Main Account</h2>
    <form @submit.prevent="register">
      <div>
        <label for="username">Username:</label>
        <input type="text" v-model="username" required />
      </div>
      <div>
        <label for="password">Password:</label>
        <input type="password" v-model="password" required />
      </div>
      <button type="submit">Register</button>
    </form>
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
    async register() {
      try {
        await axios.post('http://localhost:3000/register', {
          username: this.username,
          password: this.password,
          role: 'main'  // only main accounts can be created here
        });
        alert('Registration successful! Please log in.');
        this.$router.push('/');
      } catch (error) {
        console.error('Registration failed:', error);
      }
    }
  }
};
</script>
