<template>
  <div class="sub-account-dashboard">
    <h2>Sub Account Dashboard</h2>
    <p>
      Welcome, {{ username }}
      <button v-if="isMainLogin()" @click="back">Back</button>
    </p>
    <p>Your account status: {{ locked ? 'Locked' : 'Active' }}</p>

    <!-- Upload CSV Section -->
    <div class="upload-section">
      <h3>Upload Product CSV</h3>
      <input type="file" @change="handleFileUpload" accept=".csv" />
      <button @click="uploadCSV">Upload</button>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </div>

    <!--Upload AED Section-->
    <div class="upload-section">
      <h3>Upload AED Device CSV</h3>
      <input type="file" @change="handleFileUpload" accept=".csv" />
      <button @click="uploadAEDCSV">Upload</button>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </div>

    <!-- Product Table Section -->
    <div v-if="products.length > 0" class="product-table">
      <h3>Product List</h3>
      <!-- Add Button -->
      <button @click="startAdd">Add New Product</button>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>SKU</th>
            <th>On Hand Quantity</th>
            <th>Used Quantity</th>
            <th>Days on Hand</th>
            <th>Expiry Date</th>
            <th>Location</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(product, index) in products" :key="index">
            <td v-if="editingIndex !== index">{{ product.name }}</td>
            <td v-else><input v-model="editProduct.name" /></td>

            <td v-if="editingIndex !== index">{{ product.sku }}</td>
            <td v-else><input v-model="editProduct.sku" /></td>

            <td v-if="editingIndex !== index">{{ product.on_hand_quantity }}</td>
            <td v-else><input v-model="editProduct.on_hand_quantity" /></td>

            <td v-if="editingIndex !== index">{{ product.used_quantity }}</td>
            <td v-else><input v-model="editProduct.used_quantity" /></td>

            <td v-if="editingIndex !== index">{{ product.days_on_hand }}</td>
            <td v-else><input v-model="editProduct.days_on_hand" /></td>

            <td v-if="editingIndex !== index">{{ product.expiry_date }}</td>
            <td v-else><input v-model="editProduct.expiry_date" /></td>

            <td v-if="editingIndex !== index">{{ product.location }}</td>
            <td v-else><input v-model="editProduct.location" /></td>

            <td v-if="editingIndex !== index" class="button-cell">
              <button @click="startEdit(index, product)">Edit</button>
              <button @click="deleteProduct(product)">Delete</button>
            </td>
            <td v-else class="button-cell">
              <button @click="saveEdit(product)">Save</button>
              <button @click="cancelEdit()">Cancel</button>
            </td>
          </tr>

          <!-- New Product Row -->
          <tr v-if="isAddingNew">
            <td><input v-model="newProduct.name" placeholder="Enter product name" /></td>
            <td><input v-model="newProduct.sku" placeholder="Enter SKU" /></td>
            <td><input v-model="newProduct.on_hand_quantity" placeholder="Enter quantity" /></td>
            <td><input v-model="newProduct.used_quantity" placeholder="Enter used quantity" /></td>
            <td><input v-model="newProduct.days_on_hand" placeholder="Enter days on hand" /></td>
            <td><input v-model="newProduct.expiry_date" placeholder="Enter expiry date" /></td>
            <td><input v-model="newProduct.location" placeholder="Enter location" /></td>
            <td class="button-cell">
              <button @click="saveNewProduct">Save</button>
              <button @click="cancelAdd">Cancel</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else>
      <p>No products available.</p>
    </div>

    <!-- AED Device Table Section -->
    <div v-if="aed_devices.length > 0" class="product-table">
      <h3>AED Device List</h3>
      <!-- Add Button -->
      <button @click="startAddAED">Add New AED Device</button>
      <table>
        <thead>
          <tr>
            <th>Model Name</th>
            <th>S/N Number</th>
            <th>Location</th>
            <th>Battery Expiry Date</th>
            <th>Battery Lot Number</th>
            <th>Manufacturing Date</th>
            <th>Manufacturing Lot Number</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(product, index) in aed_devices" :key="index">
            <td v-if="aed_editingIndex !== index">{{ product.model_name }}</td>
            <td v-else><input v-model="aed_editProduct.model_name" /></td>

            <td v-if="aed_editingIndex !== index">{{ product.device_sn }}</td>
            <td v-else><input v-model="aed_editProduct.device_sn" /></td>

            <td v-if="aed_editingIndex !== index">{{ product.location }}</td>
            <td v-else><input v-model="aed_editProduct.location" /></td>

            <td v-if="aed_editingIndex !== index">{{ product.battery_expiry_date }}</td>
            <td v-else><input v-model="aed_editProduct.battery_expiry_date" /></td>

            <td v-if="aed_editingIndex !== index">{{ product.battery_lot_number }}</td>
            <td v-else><input v-model="aed_editProduct.days_on_hand" /></td>

            <td v-if="aed_editingIndex !== index">{{ product.manufacturing_date }}</td>
            <td v-else><input v-model="aed_editProduct.manufacturing_date" /></td>

            <td v-if="aed_editingIndex !== index">{{ product.manufacturing_lot_number }}</td>
            <td v-else><input v-model="aed_editProduct.manufacturing_lot_number" /></td>

            <td v-if="aed_editingIndex !== index" class="button-cell">
              <button @click="startEditAED(index, product)">Edit</button>
              <button @click="deleteAED(product)">Delete</button>
            </td>
            <td v-else class="button-cell">
              <button @click="saveEditAED(product)">Save</button>
              <button @click="cancelEditAED()">Cancel</button>
            </td>
          </tr>

          <!-- New AED Row -->
          <tr v-if="aed_isAddingNew">
            <td><input v-model="newProduct.model_name" placeholder="Enter Model Name" /></td>
            <td><input v-model="newProduct.device_sn" placeholder="Enter S/N Number" /></td>
            <td><input v-model="newProduct.location" placeholder="Enter Location" /></td>
            <td><input v-model="newProduct.battery_expiry_date" placeholder="Enter Battery Expiry Date" /></td>
            <td><input v-model="newProduct.battery_lot_number" placeholder="Enter Battery Lot Number" /></td>
            <td><input v-model="newProduct.manufacturing_date" placeholder="Enter Manufacturing Date" /></td>
            <td><input v-model="newProduct.manufacturing_lot_number" placeholder="Enter Manufacturing Lot Number" /></td>
            <td class="button-cell">
              <button @click="saveNewAED">Save</button>
              <button @click="cancelAddAED">Cancel</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else>
      <p>No AED devices available.</p>
    </div>

  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      username: '',
      parent_id: null,
      id: null,
      locked: false,
      subId: null,
      products: [],
      aed_devices: [],
      editingIndex: null,
      aed_editingIndex: null,
      editProduct: {},
      aed_editProduct: {},
      isAddingNew: false,
      aed_isAddingNew: false,
      newProduct: {},
      newAED: {},
    };
  },

  methods: {
    isMainLogin() {
      console.log(this.parent_id);
      return this.parent_id === null;
    },
    back() {
      this.$router.push({ path: '/main', query: { id: this.id } });
    },
    handleFileUpload(event) {
      this.file = event.target.files[0];
    },
    async uploadCSV() {
      if (!this.file) {
        this.errorMessage = 'Please select a CSV file.';
        return;
      }

      const formData = new FormData();
      formData.append('csvFile', this.file);

      const subAccountId = this.subId;

      try {
        const response = await axios.post(`http://localhost:3000/sub/${subAccountId}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-access-token': sessionStorage.getItem('token')
          }
        });

        // Success response: show uploaded products
        this.products = response.data;
        this.successMessage = 'CSV uploaded successfully.';
        this.errorMessage = '';

      } catch (error) {
        console.error('Error uploading CSV:', error);
        this.errorMessage = 'Error uploading CSV. Please try again.';
        this.successMessage = '';
      }
      this.fetchSubAccountProducts();
    },

    async uploadAEDCSV() {
      if (!this.file) {
        this.errorMessage = 'Please select a CSV file.';
        return;
      }

      const formData = new FormData();
      formData.append('csvFile', this.file);

      const subAccountId = this.subId;

      try {
        const response = await axios.post(`http://localhost:3000/sub/${subAccountId}/upload-aed-devices`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-access-token': sessionStorage.getItem('token')
          }
        });

        // Success response: show uploaded products
        this.aed_devices = response.data;
        this.successMessage = 'CSV uploaded successfully.';
        this.errorMessage = '';

      } catch (error) {
        console.error('Error uploading CSV:', error);
        this.errorMessage = 'Error uploading CSV. Please try again.';
        this.successMessage = '';
      }
      this.fetchSubAccountAED();
    },

    startEdit(index, product) {
      this.editingIndex = index;
      this.editProduct = { ...product }; // Create a copy of the product
    },

    startEditAED(index, aed_devices) {
      this.aed_editingIndex = index;
      this.aed_editProduct = { ...aed_devices }; // Create a copy of the AED device
    },

    async saveEdit(product) {
      const subAccountId = this.subId;
      try {
        await axios.post(`http://localhost:3000/sub/${subAccountId}/products/update/${product.name}`, this.editProduct, {
          headers: { 'x-access-token': sessionStorage.getItem('token') }
        });
        this.editingIndex = null;
        this.editProduct = {};
        this.fetchSubAccountProducts();
      } catch (error) {
        console.error('Error updating product:', error);
      }
    },

    async saveEditAED(aed_devices) {
      const subAccountId = this.subId;
      try {
        await axios.post(`http://localhost:3000/sub/${subAccountId}/products/update/${aed_devices.model_name}`, this.aed_editProduct, {
          headers: { 'x-access-token': sessionStorage.getItem('token') }
        });
        this.aed_editingIndex = null;
        this.aed_editProduct = {};
        this.fetchSubAccountAED();
      } catch (error) {
        console.error('Error updating AED device:', error);
      }
    },

    cancelEdit() {
      this.editingIndex = null;
      this.editProduct = {};
    },

    cancelEditAED() {
      this.aed_editingIndex = null;
      this.aed_editProduct = {};
    },

    startAdd() {
      this.isAddingNew = true;
      this.newProduct = {}; // clear the new product object
    },

    startAddAED() {
      this.aed_isAddingNew = true;
      this.newAED = {}; // clear the new AED object
    },

    cancelAdd() {
      this.isAddingNew = false;
      this.newProduct = {};
    },

    cancelAddAED() {
      this.aed_isAddingNew = false;
      this.newAED = {};
    },

    async saveNewProduct() {
      const subAccountId = this.subId;
      const name2add = this.newProduct.name;
      try {
        await axios.post(`http://localhost:3000/sub/${subAccountId}/products/update/${name2add}`, this.newProduct, {
          headers: { 'x-access-token': sessionStorage.getItem('token') }
        });
        this.isAddingNew = false;
        this.newProduct = {};
        this.fetchSubAccountProducts();
      } catch (error) {
        console.error('Error adding new product:', error);
      }
    },

    async saveNewAED() {
      const subAccountId = this.subId;
      const name2add = this.newAED.model_name;
      try {
        await axios.post(`http://localhost:3000/sub/${subAccountId}/products/update/${name2add}`, this.newAED, {
          headers: { 'x-access-token': sessionStorage.getItem('token') }
        });
        this.aed_isAddingNew = false;
        this.newAED = {};
        this.fetchSubAccountAED();
      } catch (error) {
        console.error('Error adding new AED device:', error);
      }
    },

    async deleteProduct(product) {
      const subAccountId = this.subId;
      alert(`Are you sure you want to delete ${product.name}?`);
      try {
        await axios.delete(`http://localhost:3000/sub/${subAccountId}/products/delete/${product.name}`, {
          headers: { 'x-access-token': sessionStorage.getItem('token') }
        });
        // Delete successful reminder
        alert('Product deleted successfully.');

        // Refresh the product list
        this.editingIndex = null;
        this.editProduct = {};
        this.fetchSubAccountProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    },

    async deleteAED(aed_devices) {
      const subAccountId = this.subId;
      alert(`Are you sure you want to delete ${aed_devices.model_name}?`);
      try {
        await axios.delete(`http://localhost:3000/sub/${subAccountId}/products/delete/${aed_devices.model_name}`, {
          headers: { 'x-access-token': sessionStorage.getItem('token') }
        });
        // Delete successful reminder
        alert('AED device deleted successfully.');

        // Refresh the product list
        this.aed_editingIndex = null;
        this.aed_editProduct = {};
        this.fetchSubAccountAED();
      } catch (error) {
        console.error('Error deleting AED device:', error);
      }
    },

    async fetchAccountInfo() {
      const token = sessionStorage.getItem('token');
      const subAccountId = this.subId;
      const response = await axios.get(`http://localhost:3000/me`, {
        headers: { 'x-access-token': token }
      });
      this.username = response.data.username;
      this.locked = response.data.locked;
      this.parent_id = response.data.parent_id;
      this.id = response.data.id;
    },
    async fetchSubAccountProducts() {
      const subAccountId = this.subId;
      try {
        const response = await axios.get(`http://localhost:3000/sub/${subAccountId}/products/latest`, {
          headers: { 'x-access-token': sessionStorage.getItem('token') }
        });
        this.products = response.data;

        // sort products by sku
        this.products.sort((a, b) => {
          const skuA = parseInt(a.sku);
          const skuB = parseInt(b.sku);
          return skuA - skuB;
        });

      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
    },

    async fetchSubAccountAED() {
      const subAccountId = this.subId;
      try {
        const response = await axios.get(`http://localhost:3000/sub/${subAccountId}/aed-devices/latest`, {
          headers: { 'x-access-token': sessionStorage.getItem('token') }
        });
        this.aed_devices = response.data;

        // sort products by model name
        this.aed_devices.sort((a, b) => {
          const modelA = a.model_name;
          const modelB = b.model_name;
          return modelA.localeCompare(modelB);
        });

      } catch (error) {
        console.error('Failed to fetch AED devices:', error);
      }
    },
  },
  mounted() {
    this.fetchAccountInfo();
    this.fetchSubAccountProducts();
    this.fetchSubAccountAED();
  },
  created() {
    this.subId = this.$route.query.id;
  }
};
</script>

<style>
/* Add some basic styling */
.upload-section {
  margin-bottom: 20px;
}
.product-table button, .aed-device-table button{
  margin-bottom: 10px;
}
.product-table table, .aed-device-table table {
  width: 70%;
  border-collapse: collapse;
}
.product-table th, .product-table td, .aed-device-table th, .aed-device-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}
.product-table th, .aed-device-table th {
  background-color: #f4f4f4;
}
.button-cell {
  display: flex;          
  justify-content: center; 
  align-items: center;    
  gap: 10px;              
  text-align: center;    
}
.error {
  color: red;
}
</style>
