<template>
  <div>
    <h2>Welcome, {{ username }}</h2>
  </div>
  <div class="main-account-dashboard">
    <!-- left side navigation -->
    <nav class="sidebar">
      <ul>
        <li>
          <router-link :to="{ path: '/main/my-account', query: { id: mainId } }" class="nav-item">My Account</router-link>
        </li>
        <li>
          <router-link :to="{ path: '/main/sites', query: { id: mainId } }" class="nav-item">Sites</router-link>
        </li>
        <li>
          <router-link :to="{ path: '/main/equipment', query: { id: mainId } }" class="nav-item">Equipment</router-link>
        </li>
      </ul>
    </nav>

    <!-- right side -->
    <div class="content">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      mainId: null,
      username: '',
    };
  },

  methods: {
    async fetchAccountInfo() {
      const token = sessionStorage.getItem('token');
      const mainId = this.mainId;
      const response = await axios.get(`http://localhost:3000/me`, {
        headers: { 'x-access-token': token }
      });
      this.username = response.data.username;
    },
  },

  mounted() {
    if (this.$route.path === '/main') {
      this.$router.push({path: '/main/my-account', query: { id: this.mainId }});
    }
    this.fetchAccountInfo();
  },

  created() {
    this.mainId = this.$route.query.id;
  },
};
</script>

<style scoped>
.main-account-dashboard {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 200px;
  background-color: #f8f9fa;
  border-right: 1px solid #ddd;
  padding: 20px;
}

.sidebar ul {
  list-style: none;
  padding: 0;
}

.nav-item {
  display: block;
  text-decoration: none;
  color: #007bff;
  margin-bottom: 15px;
}

.nav-item:hover {
  text-decoration: underline;
}

.content {
  flex: 1;
  padding: 20px;
  background-color: #ffffff;
}
</style>
