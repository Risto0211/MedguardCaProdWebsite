<template>
  <div class="admin-dashboard">
    <h2>Admin Dashboard</h2>
    <h3>All Users</h3>
    <div v-for="mainAccount in groupedAccounts" :key="mainAccount.id">
      <h4>Main Account: {{ mainAccount.username }} ({{ mainAccount.locked ? 'Locked' : 'Active' }})</h4>
      <button @click="lockAccount(mainAccount.id)" :disabled="mainAccount.locked">Lock</button>
      <button @click="deleteAccount(mainAccount.id)">Delete</button>
      <ul>
        <li v-for="subAccount in mainAccount.subAccounts" :key="subAccount.id">
          Sub Account: {{ subAccount.username }} ({{ subAccount.locked ? 'Locked' : 'Active' }})
          <button @click="lockAccount(subAccount.id)" :disabled="subAccount.locked">Lock</button>
          <button @click="deleteAccount(subAccount.id)">Delete</button>   
        </li>
      </ul>
    </div>
    <h3>Add New Main Account</h3>
    <form @submit.prevent="addMainAcount">
      <input type="text" v-model="newUsername" placeholder="Main Account Username" required />
      <input type="password" v-model="newPassword" placeholder="Password" required />
      <button type="submit">Add Main Account</button>
    </form>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      groupedAccounts: [],
      adminId: null,
    };
  },
  methods: {
    async fetchAccounts() {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/admin/users', {
        headers: { 'x-access-token': token }
      });
      this.groupedAccounts = response.data;
    },
    async lockAccount(accountId) {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:3000/admin/users/${accountId}/lock`, {}, {
        headers: { 'x-access-token': token }
      });
      this.fetchAccounts(); // refresh the account list
    },
    async deleteAccount(accountId) {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/admin/users/${accountId}`, {
        headers: { 'x-access-token': token }
      });
      this.fetchAccounts(); // refresh the account list
    },
    async addMainAcount() {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/register', {
        username: this.newUsername,
        password: this.newPassword,
        role: 'main'
      }, {
        headers: { 'x-access-token': token }
      });
      this.fetchAccounts(); // refresh the account list
    }
  },
  mounted() {
    this.fetchAccounts()
  },
  created() {
    this.adminId = this.$route.query.adminId;
  }
};
</script>
