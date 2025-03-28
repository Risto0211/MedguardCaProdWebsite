<template>
    <div>
        <h2>Account Info</h2>
        <h3>Your Sub Accounts</h3>
        <table>
        <thead>
            <tr>
            <th>Username</th>
            <th>Status</th>
            <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="subAccount in subAccounts" :key="subAccount.id">
            <td>{{ subAccount.username }}</td>
            <td>{{ subAccount.locked ? 'Locked' : 'Active' }}</td>
            <td>
                <button @click="lockSubAccount(subAccount.id)" :disabled="subAccount.locked">Lock</button>
                <button @click="deleteSubAccount(subAccount.id)">Delete</button>
                <button @click="goToSubAccount(subAccount.id)">Go to</button>
            </td>
            </tr>
        </tbody>
        </table>

        <h3>Add New Sub Account</h3>
        <form @submit.prevent="addSubAccount">
        <input type="text" v-model="newSubUsername" placeholder="Sub Account Username" required />
        <input type="password" v-model="newSubPassword" placeholder="Password" required />
        <button type="submit">Add Sub Account</button>
        </form>
    </div>
  </template>
  
  <script>
  import axios from 'axios';

  export default {
    data() {
      return {
        subAccounts: [],
        newSubUsername: '',
        newSubPassword: '',
        mainId: null,
      };
    },

    methods: {
        async fetchSubAccounts() {
            const token = sessionStorage.getItem('token');
            const response = await axios.get(`http://localhost:3000/main/users/${this.mainId}/subaccounts`, {
                headers: { 'x-access-token': token }
            });
            this.subAccounts = response.data;
        },

        async addSubAccount() {
            const token = sessionStorage.getItem('token');
            await axios.post('http://localhost:3000/register', {
                username: this.newSubUsername,
                password: this.newSubPassword,
                role: 'sub',
                parent_id: this.mainId
            }, {
                headers: { 'x-access-token': token }
            });
            this.newSubUsername = '';
            this.newSubPassword = '';
            this.fetchSubAccounts();
        },
            
        async lockSubAccount(subAccountId) {
            const token = sessionStorage.getItem('token');
            await axios.put(`http://localhost:3000/main/users/${this.mainId}/subaccounts/${subAccountId}/lock`, {}, {
                headers: { 'x-access-token': token }
            });
            this.fetchSubAccounts();
        },
            
        async deleteSubAccount(subAccountId) {
            const token = sessionStorage.getItem('token');
            await axios.delete(`http://localhost:3000/main/users/${this.mainId}/subaccounts/${subAccountId}`, {
                headers: { 'x-access-token': token }
            });
            this.fetchSubAccounts();
        },
            
        async goToSubAccount(subAccountId) {
            this.$router.push({ path: '/sub', query: { id: subAccountId } });
        },
    },

    mounted() {
        this.fetchSubAccounts();
    },

    created() {
        this.mainId = this.$route.query.id;
    }
  };
  </script>
  