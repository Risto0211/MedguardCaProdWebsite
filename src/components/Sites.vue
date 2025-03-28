<template>
    <div class="main-account">
    <h1>Sub Accounts Information</h1>
    <div v-if="subAccounts.length === 0">
      <p>No sub accounts available.</p>
    </div>
    <div v-else>
    <div v-for="subAccountid in subAccountsIds" :key="subAccountid.id" class="sub-account">
      <h2>{{ subAccountid.username }}</h2> 
      <p><strong>Name:</strong> {{ subAccounts.find(item => item.id === subAccountid.id).name || "Not Included" }}</p>
      <p><strong>Contact:</strong> {{ subAccounts.find(item => item.id === subAccountid.id).contact || "Not Included" }}</p>
      <p><strong>Email:</strong> {{ subAccounts.find(item => item.id === subAccountid.id).email || "Not Included" }}</p>
      <p><strong>Address:</strong> {{ subAccounts.find(item => item.id === subAccountid.id).address || "Not Included" }}</p>
    </div>
  </div>
  </div>
  </template>
  
  <script>
  import axios from 'axios';

  export default {
    data() {
      return {
        subAccounts: [],
        subAccountsIds: [],
      };
    },

    methods:{
      async fetchSubAccountIds() {
            const token = sessionStorage.getItem('token');
            const response = await axios.get(`http://localhost:3000/main/users/${this.mainId}/subaccounts`, {
                headers: { 'x-access-token': token }
            });
            const rows = response.data;
            this.subAccountsIds = rows.map(row => ({id:row.id, username: row.username}));   
            console.log(this.subAccountsIds);       
        },
      async fetchSubAccounts() {
      const promises = this.subAccountsIds.map(async (subid) => {
        try {
          const response = await axios.get(`http://localhost:3000/user_info/${subid.id}`, {
            headers: { "x-access-token": localStorage.getItem("token") },
          });
          const res = response.data;
          const subAccount = {
            id: subid.id,
            name: res.name || "Not Included",
            contact: res.contact || "Not Included",
            email: res.email || "Not Included",
            address: res.address || "Not Included",
          };
          console.log(subid.id);
          console.log(subAccount);

          return subAccount;
        } catch (error) {
          console.error(`Error fetching info for sub account ${subid.id}:`, error);
        }
      });

      const results = await Promise.all(promises);
      this.subAccounts = results;
      console.log(this.subAccounts);
    },
    },

    async created() {
        this.mainId = this.$route.query.id;
        await this.fetchSubAccountIds();
        await this.fetchSubAccounts();
    }
  };

  </script>
  
  <style scoped>
.sub-account {
  margin-bottom: 20px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #f9f9f9;
}

h2 {
  margin-bottom: 10px;
}

p {
  margin: 5px 0;
}

strong {
  color: #4CAF50;
}
</style>