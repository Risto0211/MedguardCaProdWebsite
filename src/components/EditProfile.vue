<template>
    <div class="edit-user">
      <h2>Edit User Information</h2>
      <form @submit.prevent="submitForm">
        <div class="form-group">
          <label for="name">Name:</label>
          <input type="name" id="name" v-model="user.name" required />
        </div>
        <div class="form-group">
          <label for="email">Email:</label>
          <input type="email" id="email" v-model="user.email" required />
        </div>
        <div class="form-group">
          <label for="phone">Phone Number:</label>
          <input type="text" id="phone" v-model="user.contact" />
        </div>
        <div class="form-group">
          <label for="address">Address:</label>
          <textarea id="address" v-model="user.address"></textarea>
        </div>
        <div class="form-actions">
            <button @click="back">Back</button>
          <button type="submit">Save</button>
        </div>
      </form>
    </div>
  </template>
  
  <script>
  import axios from "axios";
  
  export default {
    data() {
      return {
        user: {
            user_id: "",
          username: "",
          name: "",
          email: "",
          contact: "",
          address: "",
          role: "",
        },
        userId: null,
      };
    },
    methods: {
    async back() {
        this.$router.push({ path: `/${this.user["role"]}/`, query: { id: this.userId } });
        },
    async fetchAccountInfo() {
      const token = sessionStorage.getItem('token');
      const userId = this.userId;
      const response = await axios.get(`http://localhost:3000/me`, {
        headers: { 'x-access-token': token }
      });
      this.user['user_id'] = this.userId;
      this.user['username'] = response.data.username;
      this.user['role'] = response.data.role;
    },
      async submitForm() {
        try {
          const response = await axios.put(
            `http://localhost:3000/user_info/${this.userId}`,
            this.user
          );
          alert("User information updated successfully");
          console.log(this.user);
          this.$router.push({ path: `/${this.user["role"]}/`, query: { id: this.userId } });
        } catch (error) {
          alert("An error occurred. Please try again.");
        }
      },
    },
    mounted() {
        this.fetchAccountInfo();
    },
    created() {
    this.userId = this.$route.query.id;
    }
  };
  </script>
  
  <style scoped>
  .edit-user {
    max-width: 600px;
    margin: 20px auto;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: #f9f9f9;
  }
  .form-group {
    margin-bottom: 15px;
  }
  .form-group label {
    display: block;
    font-weight: bold;
    margin-bottom: 5px;
  }
  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 8px;
    box-sizing: border-box;
  }
  .form-actions {
    display: flex;
    text-align: right;
    gap: 10px;
  }
  button {
    padding: 10px 15px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  button:hover {
    background-color: #0056b3;
  }
  </style>
  