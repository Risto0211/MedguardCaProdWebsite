// src/router.js
import { createRouter, createWebHistory } from 'vue-router';
import Login from './components/Login.vue';
import AdminDashboard from './components/AdminDashboard.vue';
import MainAccountDashboard from './components/MainAccountDashboard.vue';
import SubAccountDashboard from './components/SubAccountDashboard.vue';
import Register from './components/Register.vue';
// import path from 'path';
import MainAccountInfo from './components/MainAccountInfo.vue';
import Sites from './components/Sites.vue';
import Equipment from './components/Equipment.vue';
import EditProfile from './components/EditProfile.vue'

const routes = [
  { path: '/', component: Login },
  { path: '/register', component: Register },
  { path: '/admin', component: AdminDashboard },
  { path: '/main', 
    component: MainAccountDashboard, 
    children: [
      { path: 'my-account', component: MainAccountInfo },
      { path: 'sites', component: Sites },
      { path: 'equipment', component: Equipment },
    ], 
  },
  { path: '/sub', component: SubAccountDashboard },
  { path: '/editprofile', component: EditProfile}
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

