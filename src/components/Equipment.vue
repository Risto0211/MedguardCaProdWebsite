<template>
      <h2>Equipment Information</h2>
      <div v-for="subId in allsubids" :key="subId" class="main-account-products">
        <h3>Site: {{ subUsernameCache[subId] }}</h3>
        <h4>Products</h4>
        <table v-if="groupedProducts.find(item => Number(item.subId) === Number(subId))">
          <thead>
            <tr>
              <th>Name</th>
              <th>SKU</th>
              <th>On Hand Quantity</th>
              <th>Used Quantity</th>
              <th>Days on Hand</th>
              <th>Expiry Date</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(product, index) in groupedProducts.find(item => Number(item.subId) === Number(subId)).products" :key="index">
              <td>{{ product.name }}</td>
              <td>{{ product.sku }}</td>
              <td>{{ product.on_hand_quantity }}</td>
              <td>{{ product.used_quantity }}</td>
              <td>{{ product.days_on_hand }}</td>
              <td>{{ product.expiry_date }}</td>
              <td>{{ product.location }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else>
          <p>No products available.</p>
          </div>  

        <h4>AED Devices</h4>
        <table v-if="grouped_aed_devices.find(item => Number(item.subId) === Number(subId))">
          <thead>
            <tr>
              <th>Model Name</th>
              <th>S/N Number</th>
              <th>Location</th>
              <th>Battery Expiry Date</th>
              <th>Battery Lot Number</th>
              <th>Manufacturing Date</th>
              <th>Manufacturing Lot Number</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(device, index) in grouped_aed_devices.find(item => Number(item.subId) === Number(subId)).aedDevices" :key="index">
              <td>{{ device.model_name }}</td>
              <td>{{ device.serial_number }}</td>
              <td>{{ device.location }}</td>
              <td>{{ device.battery_expiry_date }}</td>
              <td>{{ device.battery_lot_number }}</td>
              <td>{{ device.manufacturing_date }}</td>
              <td>{{ device.manufacturing_lot_number }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else>
          <p>No AED devices available.</p>
          </div>
      </div>
  </template>

<script>
import axios from 'axios';
import { toRaw } from 'vue';

export default {
  data() {
    return {
      mainId: null,
      groupedProducts: [],
      grouped_aed_devices: [],
      groupedEquipments: [],
      subUsernameCache: {},
      allsubids: [],
    };
  },

  methods:{
      async fetchSubAccountProducts() {
      const mainAccountId = this.mainId; 
      try {
          const response = await axios.get(`http://localhost:3000/main/users/${mainAccountId}/sub-products`, {
          headers: { 'x-access-token': sessionStorage.getItem('token') }
          });
          this.groupedProducts = response.data;
      } catch (error) {
          console.error('Failed to fetch sub account products:', error);
      }
      },
      async fetchSubAccountAED() {
        const mainAccountId = this.mainId; 
      try {
        const response = await axios.get(`http://localhost:3000/main/users/${mainAccountId}/sub-aed-devices`, {
          headers: { 'x-access-token': sessionStorage.getItem('token') }
        });
        this.grouped_aed_devices = response.data;
      } catch (error) {
        console.error('Failed to fetch AED devices:', error);
      }
    },

      async MatchIDandName() {
        this.groupedProducts.forEach((subGroup) => {
          this.FetchsubUsername(subGroup.subId).then((username) => {
            this.subUsernameCache[subGroup.subId] = username;
            this.allsubids.push(subGroup.subId);
          });
      });
      this.grouped_aed_devices.forEach((subGroup) => {
        this.FetchsubUsername(subGroup.subId).then((username) => {
          if (this.subUsernameCache[subGroup.subId] === undefined) {
            this.subUsernameCache[subGroup.subId] = username;
            this.allsubids.push(subGroup.subId);
          }
        });
      });
      console.log(this.subUsernameCache);
      },

      async FetchsubUsername(subAccountId) {
      try {
          const response = await axios.get(`http://localhost:3000/match/${subAccountId}`, {
          headers: { 'x-access-token': sessionStorage.getItem('token') }
          });
          return response.data.username;
      } catch (error) {
          console.error('Failed to fetch sub account username:', error);
      }
      },
  },

  async mounted() {
      await this.fetchSubAccountProducts();
      await this.fetchSubAccountAED();
      await this.MatchIDandName();
  },
  created() {
      this.mainId = this.$route.query.id;
  }
};

</script>

<style>
  .main-account-products table {
      margin-top: 20px;
      width: 100%;
      border-collapse: collapse;
  }
  .main-account-products th, .main-account-products td {
      border: 1px solid #ddd;
      padding: 8px;
  }
  .main-account-products th {
      background-color: #f2f2f2;
  }
</style>
