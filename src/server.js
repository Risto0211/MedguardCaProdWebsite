const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cors = require('cors');
const { parse } = require('vue/compiler-sfc');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const csvParser = require('csv-parser');
const path = require('path');
const fileUpload = require('express-fileupload');

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(fileUpload());

const SECRET_KEY = 'your_secret_key_here';

// Starting server
console.log('Starting server...');

// initialize database
const db = new sqlite3.Database('./userdb.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');

    // create users table containing username, password, role, parent_id, and locked columns
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT,
      parent_id INTEGER DEFAULT NULL,
      locked INTEGER DEFAULT 0
    )`);

    // add an admin user if it doesn't exist
    const adminUsername = 'admin';
    const adminPassword = bcrypt.hashSync('111111', 8); // 111111 as the default password
    const adminRole = 'admin';

    db.get(`SELECT * FROM users WHERE username = ?`, [adminUsername], (err, row) => {
      if (!row) {
        db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`, [adminUsername, adminPassword, adminRole], (err) => {
          if (err) {
            console.error('Error creating admin user:', err.message);
          } else {
            console.log('Admin user created successfully.');
          }
        });
      }
    });

    // create products table containing name, sku, on_hand_quantity, used_quantity, days_on_hand, expiry_date, location, main_account_id, and sub_account_id columns
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      sku TEXT,
      on_hand_quantity INTEGER,
      used_quantity INTEGER,
      days_on_hand INTEGER,
      expiry_date TEXT,
      location TEXT,
      main_account_id INTEGER,
      sub_account_id INTEGER,
      version INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(main_account_id) REFERENCES users(id),
      FOREIGN KEY(sub_account_id) REFERENCES users(id)
    )`, (err) => {
      if (err) {
        console.error('Error creating products table:', err.message);
      } else {
        console.log('Products table created successfully.');
      }
    }
  );

  // create AED device table containing model name, device S/N number, location, battery expiry date and lot number, manufacturing date and lot number
  db.run(`CREATE TABLE IF NOT EXISTS aed_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_name TEXT,
    device_sn TEXT,
    location TEXT,
    battery_expiry_date TEXT,
    battery_lot_number TEXT,
    manufacturing_date TEXT,
    manufacturing_lot_number TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    main_account_id INTEGER,
    sub_account_id INTEGER,
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(main_account_id) REFERENCES users(id),
    FOREIGN KEY(sub_account_id) REFERENCES users(id)
  )`, (err) => {
    if (err) {
      console.error('Error creating AED devices table:', err.message);
    } else {
      console.log('AED devices table created successfully.');
    }
  }); 

  // create user info table containing user_id, username, contact, email, address, and role columns
  db.run(`CREATE TABLE IF NOT EXISTS user_info (
    user_id INTEGER,
    username TEXT,
    name TEXT,
    contact TEXT,
    email TEXT,
    address TEXT,
    role TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(username) REFERENCES users(username)
  )`, (err) => {
    if (err) {
      console.error('Error creating user info table:', err.message);
    } else {
      console.log('User info table created successfully.');
    }
  });
  }
});

// login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
    if (err) {
      console.error('Database error:', err); // print database error
      return res.status(500).send('Internal server error.'); // send internal server error response
    }
  
    if (!user) {
      console.log(`User not found: ${username}`); // print user not found
      return res.status(404).send('User not found.');
    }

    // check if the user is locked (main account or sub account)
    if (user.locked) {
      return res.status(403).send('Account locked.');
    }

    authenticateUser(user, password, res);
  });
});

// authenticate user and send token
function authenticateUser(user, password, res) {
  const passwordIsValid = bcrypt.compareSync(password, user.password);
  if (!passwordIsValid) {
    return res.status(401).send('Invalid password.');
  }

  const token = jwt.sign({ username: user.username, role: user.role, id: user.id }, SECRET_KEY, {
    expiresIn: 86400 // 24 h
  });

  res.status(200).send({ auth: true, token });
}

// register route
app.post('/register', (req, res) => {
  console.log('Registering user:', req.body);
  const { username, password, role, parent_id } = req.body;

  const hashedPassword = bcrypt.hashSync(password, 8);

  db.run(`INSERT INTO users (username, password, role, parent_id) VALUES (?, ?, ?, ?)`, [username, hashedPassword, role, parent_id], (err) => {
    if (err) {
      console.error('Database error:', err); // print database error
      return res.status(500).send('Internal server error.'); // send internal server error response
    }
    res.status(200).send('User registered successfully.');
  });
});


// admin checking all users (grouped by main account and its sub accounts)
app.get('/admin/users', (req, res) => {
  const token = req.headers['x-access-token'];
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err || decoded.role !== 'admin') {
      return res.status(403).send('Access denied.');
    }

    db.all(`SELECT id, username, role, locked, parent_id FROM users ORDER BY role, parent_id`, [], (err, rows) => {
      if (err) {
        return res.status(500).send('Error retrieving users.');
      }

      const groupedAccounts = rows.filter(user => user.role === 'main').map(mainAccount => ({
        ...mainAccount,
        subAccounts: rows.filter(subAccount => subAccount.parent_id === mainAccount.id)
      }));

      res.status(200).send(groupedAccounts);
    });
  });
});

// lock account
// if is sub account, lock only itself
// if is main account, lock all its sub accounts as well
// (admin operation)
app.put('/admin/users/:id/lock', (req, res) => {
  const userId = req.params.id;
  const token = req.headers['x-access-token'];

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err || decoded.role !== 'admin') {
      return res.status(403).send('Access denied.');
    }

    // lock account and all its sub accounts
    db.run(`UPDATE users SET locked = 1 WHERE parent_id = ?`, [userId], (err) => {
      if (err) {
        return res.status(500).send('Error locking subaccounts.');
      }

      db.run(`UPDATE users SET locked = 1 WHERE id = ?`, [userId], (err) => {
        if (err) {
          return res.status(500).send('Error locking account.');
        }
        res.status(200).send('Account and all associated subaccounts locked successfully.');
      });
    });
  });
});

// delete account
// if is sub account, delete only itself
// if is main account, delete all its sub accounts
// (admin operation)
app.delete('/admin/users/:id', (req, res) => {
  const userId = req.params.id;
  const token = req.headers['x-access-token'];

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err || decoded.role !== 'admin') {
      return res.status(403).send('Access denied.');
    }

    // delete account and all its sub accounts
    db.run(`DELETE FROM users WHERE parent_id = ?`, [userId], (err) => {
      if (err) {
        return res.status(500).send('Error deleting subaccounts.');
      }

      db.run(`DELETE FROM users WHERE id = ?`, [userId], (err) => {
        if (err) {
          return res.status(500).send('Error deleting account.');
        }
        res.status(200).send('Account and all associated subaccounts deleted successfully.');
      }
      );
    });
  });
});

// main account lock its sub account
app.put('/main/users/:id/subaccounts/:id/lock', (req, res) => {
  const subAccountId = req.params.id;
  const token = req.headers['x-access-token'];

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err || decoded.role !== 'main') {
      return res.status(403).send('Access denied.');
    }

    db.run(`UPDATE users SET locked = 1 WHERE id = ? AND parent_id = ?`, [subAccountId, decoded.id], (err) => {
      if (err) {
        return res.status(500).send('Error locking subaccount.');
      }
      res.status(200).send('Subaccount locked successfully.');
    });
  });
});

// main account delete its sub account
app.delete('/main/users/:id/subaccounts/:id', (req, res) => {
  const subAccountId = req.params.id;
  const token = req.headers['x-access-token'];

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err || decoded.role !== 'main') {
      return res.status(403).send('Access denied.');
    }

    db.run(`DELETE FROM users WHERE id = ? AND parent_id = ?`, [subAccountId, decoded.id], (err) => {
      if (err) {
        return res.status(500).send('Error deleting subaccount.');
      }
      res.status(200).send('Subaccount deleted successfully.');
    });
  });
});

// get all sub accounts of a main account
app.get('/main/users/:id/subaccounts', (req, res) => {
  const userId = req.params.id;
  const token = req.headers['x-access-token'];

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err || decoded.id !== parseInt(userId)) {
      return res.status(403).send('Access denied.');
    }

    db.all(`SELECT id, username, role, locked FROM users WHERE parent_id = ?`, [userId], (err, rows) => {
      if (err) {
        return res.status(500).send('Error retrieving subaccounts.');
      }
      res.status(200).send(rows);
    });
  });
});


// get all products of subs of a main account
app.get('/main/users/:mainAccountId/sub-products', (req, res) => {
  const mainAccountId = req.params.mainAccountId;

  // inquery the latest version of products of each sub account
  const query = `
    SELECT p1.*
    FROM products p1
    INNER JOIN (
      SELECT sub_account_id, name, MAX(version) AS latestVersion
      FROM products
      WHERE main_account_id = ?
      GROUP BY sub_account_id, name
    ) p2 ON p1.sub_account_id = p2.sub_account_id AND p1.name = p2.name AND p1.version = p2.latestVersion
    WHERE p1.main_account_id = ?
  `;

  db.all(query, [mainAccountId, mainAccountId], (err, rows) => {
    if (err) {
      return res.status(500).send('Error retrieving products.');
    }
    
    // Group products by sub account ID
    const groupedProducts = rows.reduce((acc, product) => {
      if (!acc[product.sub_account_id]) {
        acc[product.sub_account_id] = {
          subId: product.sub_account_id,
          products: []
        };
      }
      acc[product.sub_account_id].products.push(product);
      return acc;
    }, {});

    // Sort products by sub account ID and SKU
    const result = Object.values(groupedProducts).sort((a, b) => a.subId - b.subId).map(sub => {
      sub.products.sort((a, b) => parseInt(a.sku) - parseInt(b.sku));
      return sub;
    });

    res.json(result);
  });
});

//get all AED devices of subs of a main account
app.get('/main/users/:mainAccountId/sub-aed-devices', (req, res) => {
  const mainAccountId = req.params.mainAccountId;

  // inquery the latest version of AED devices of each sub account
  const query = `
    SELECT p1.*
    FROM aed_devices p1
    INNER JOIN (
      SELECT sub_account_id, model_name, device_sn, MAX(version) AS latestVersion
      FROM aed_devices
      WHERE main_account_id = ?
      GROUP BY sub_account_id, model_name, device_sn
    ) p2 ON p1.sub_account_id = p2.sub_account_id AND p1.model_name = p2.model_name AND p1.device_sn = p2.device_sn AND p1.version = p2.latestVersion
    WHERE p1.main_account_id = ?
  `;

  db.all(query, [mainAccountId, mainAccountId], (err, rows) => {
    if (err) {
      return res.status(500).send('Error retrieving AED devices.');
    }
    
    // Group AED devices by sub account ID
    const groupedAEDDevices = rows.reduce((acc, aedDevice) => {
      if (!acc[aedDevice.sub_account_id]) {
        acc[aedDevice.sub_account_id] = {
          subId: aedDevice.sub_account_id,
          aedDevices: []
        };
      }
      acc[aedDevice.sub_account_id].aedDevices.push(aedDevice);
      return acc;
    }, {});

    // Sort AED devices by sub account ID and model name
    const result = Object.values(groupedAEDDevices).sort((a, b) => a.subId - b.subId).map(sub => {
      sub.aedDevices.sort((a, b) => a.model_name.localeCompare(b.model_name));
      return sub;
    });

    res.json(result);
  });
});

// delete account (main account or sub account)
// (admin operation)
app.delete('/admin/users/:id', (req, res) => {
  const userId = req.params.id;
  const token = req.headers['x-access-token'];

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err || (decoded.id !== parseInt(userId) && decoded.role !== 'admin')) {
      return res.status(403).send('Access denied.');
    }

    // delete account and all its sub accounts
    db.run(`DELETE FROM users WHERE parent_id = ?`, [userId], (err) => {
      if (err) {
        return res.status(500).send('Error deleting subaccounts.');
      }

      db.run(`DELETE FROM users WHERE id = ?`, [userId], (err) => {
        if (err) {
          return res.status(500).send('Error deleting account.');
        }
        res.status(200).send('Account and all associated subaccounts deleted successfully.');
      });
    });
  });
});

// get present user account information
app.get('/me', (req, res) => {
  const token = req.headers['x-access-token'];

  if (!token) {
    return res.status(401).send('No token provided.');
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(500).send('Failed to authenticate token.');
    }

    const query = `SELECT * FROM users WHERE username = ?`;
    db.get(query, [decoded.username], (err, row) => {
      if (err) {
        return res.status(500).send('Error retrieving user info.');
      }
      res.status(200).send(row);
    });
  });
});

// get user information
app.get('/user_info/:id', (req, res) => {
  const userId = req.params.id;

  db.get(`SELECT * FROM user_info WHERE user_id = ?`, [userId], (err, row) => {
    if (err) {
      return res.status(500).send('Error retrieving user info.');
    }
    res.status(200).send(row);
  });
});

// update user information
app.put('/user_info/:id', (req, res) => {
  const userId = req.params.id;
  const { username, name, contact, email, address, role } = req.body;

  // check if the user info exists
  db.get(`SELECT * FROM user_info WHERE user_id = ?`, [userId], (err, row) => {
    if (err) {
      return res.status(500).send('Error updating user info.');
    }

    if (!row) {
      // insert new user info
      console.log('Inserting new user info:', req.body);
      db.run(`INSERT INTO user_info (user_id, username, name, contact, email, address, role) VALUES (?, ?, ?, ?, ?, ?, ?)`, [userId, username, name, contact, email, address, role], (err) => {
        if (err) {
          return res.status(500).send('Error updating user info.');
        }
        res.status(200).send('User info updated successfully.');
      });
    } else {
      // update existing user info
      console.log('Updating user info:', req.body);
      db.run(`UPDATE user_info SET user_id = ?, username = ?, name = ?, contact = ?, email = ?, address = ?, role = ? WHERE user_id = ?`, [userId, username, name, contact, email, address, role, userId], (err) => {
        if (err) {
          return res.status(500).send('Error updating user info.');
        }
        res.status(200).send('User info updated successfully.');
      });
    }
  });
});


app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

// upload products
app.post('/sub/:subAccountId/upload', (req, res) => {
  const subAccountId = req.params.subAccountId;

  if (!req.files || !req.files.csvFile) {
    return res.status(400).send('No file uploaded.');
  }

  const csvFile = req.files.csvFile;
  const uploadDir = path.join(__dirname, '/uploads');

  // Ensure the uploads directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }

  // Generate a unique filename to avoid conflicts
  const uniqueFileName = Date.now() + '-' + csvFile.name;

  // check main_account_id (parent_id)
  db.get(`SELECT parent_id FROM users WHERE id = ? AND role = 'sub'`, [subAccountId], (err, row) => {
    if (err || !row) {
      return res.status(404).send('Sub account or parent account not found.');
    }

    const parentId = row.parent_id; // get main_account_id

    // Ensure the upload folder has a subfolder for the main account
    const mainAccountDir = path.join(uploadDir, parentId.toString());

    if (!fs.existsSync(mainAccountDir)) {
      fs.mkdirSync(mainAccountDir);
    }

    // Ensure the upload folder has a subfolder for the sub account
    const subAccountDir = path.join(mainAccountDir, subAccountId.toString());

    if (!fs.existsSync(subAccountDir)) {
      fs.mkdirSync(subAccountDir);
    }

    // create the path to save the file
    const uploadPath = path.join(subAccountDir, uniqueFileName);

    // save the file to the server
    csvFile.mv(uploadPath, (err) => {
      if (err) {
        return res.status(500).send(err);
      }

      // parse the CSV file
      const products = [];
      fs.createReadStream(uploadPath)
        .pipe(csvParser({
          mapHeaders: ({ header }) => header.trim().replace(/\s+/g, '_') // replace spaces with underscores
        }))
        .on('data', (row) => {
          products.push({
            name: row.Product_Name,
            sku: row.SKU,
            on_hand_quantity: row.On_Hand_Quantity,
            used_quantity: row.Used_Quantity,
            days_on_hand: row.Days_on_Hand,
            expiry_date: row.Expiry_Date,
            location: row.Location,
            main_account_id: parentId,
            sub_account_id: subAccountId
          });
        })
        .on('end', () => {
          // For each product, determine the new version and insert it
          products.forEach(product => {
            // Get the maximum version of the product with the same name and sub_account_id
            db.get(`SELECT MAX(version) AS max_version FROM products WHERE sub_account_id = ? AND name = ?`, 
            [subAccountId, product.name], (err, result) => {
              if (err) {
                console.error('Error fetching max version:', err);
                return;
              }

              const newVersion = (result && result.max_version) ? result.max_version + 1 : 1;  
              product.version = newVersion;

              // Insert product with new version
              db.run(`INSERT INTO products (name, sku, on_hand_quantity, used_quantity, days_on_hand, expiry_date, location, main_account_id, sub_account_id, version, created_at) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [product.name, product.sku, product.on_hand_quantity, product.used_quantity, product.days_on_hand, product.expiry_date, product.location, product.main_account_id, product.sub_account_id, product.version], 
                (err) => {
                  if (err) {
                    console.error('Error inserting product:', err);
                  }
                });
            });
          });

          res.status(200).send(products); // return the products
        });
    });
  });
});

//upload AED devices
app.post('/sub/:subAccountId/upload-aed-devices', (req, res) => {
  const subAccountId = req.params.subAccountId;

  if (!req.files || !req.files.csvFile) {
    return res.status(400).send('No file uploaded.');
  }

  const csvFile = req.files.csvFile;
  const uploadDir = path.join(__dirname, '/uploads');

  // Ensure the uploads directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }

  // Generate a unique filename to avoid conflicts
  const uniqueFileName = Date.now() + '-' + csvFile.name;

  // check main_account_id (parent_id)
  db.get(`SELECT parent_id FROM users WHERE id = ? AND role = 'sub'`, [subAccountId], (err, row) => {
    if (err || !row) {
      return res.status(404).send('Sub account or parent account not found.');
    }

    const parentId = row.parent_id; // get main_account_id

    // Ensure the upload folder has a subfolder for the main account
    const mainAccountDir = path.join(uploadDir, parentId.toString());

    if (!fs.existsSync(mainAccountDir)) {
      fs.mkdirSync(mainAccountDir);
    }

    // Ensure the upload folder has a subfolder for the sub account
    const subAccountDir = path.join(mainAccountDir, subAccountId.toString());

    if (!fs.existsSync(subAccountDir)) {
      fs.mkdirSync(subAccountDir);
    }

    // create the path to save the file
    const uploadPath = path.join(subAccountDir, uniqueFileName);

    // save the file to the server
    csvFile.mv(uploadPath, (err) => {
      if (err) {
        return res.status(500).send(err);
      }

      // parse the CSV file
      const aedDevices = [];
      fs.createReadStream(uploadPath)
        .pipe(csvParser({
          mapHeaders: ({ header }) => header.trim().replace(/\s+/g, '_') // replace spaces with underscores
        }))
        .on('data', (row) => {
          console.log(row);
          aedDevices.push({
            model_name: row.Model_Name,
            device_sn: row.SN_Number,
            location: row.Location,
            battery_expiry_date: row.Battery_Expiry_Date,
            battery_lot_number: row.Battery_Lot_Number,
            manufacturing_date: row.Manufacturing_Date,
            manufacturing_lot_number: row.Manufacturing_Lot_Number,
            main_account_id: parentId,
            sub_account_id: subAccountId
          });
          console.log(aedDevices);
        })
        .on('end', () => {
          // For each AED device, determine the new version and insert it
          aedDevices.forEach(aedDevice => {
            // Get the maximum version of the AED device with the same model name and sub_account_id
            db.get(`SELECT MAX(version) AS max_version FROM aed_devices WHERE sub_account_id = ? AND model_name = ?`, 
            [subAccountId, aedDevice.model_name], (err, result) => {
              if (err) {
                console.error('Error fetching max version:', err);
                return;
              }

              const newVersion = (result && result.max_version) ? result.max_version + 1 : 1;  
              aedDevice.version = newVersion;

              // Insert AED device with new version
              db.run(`INSERT INTO aed_devices (model_name, device_sn, location, battery_expiry_date, battery_lot_number, manufacturing_date, manufacturing_lot_number, main_account_id, sub_account_id, version, created_at) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [aedDevice.model_name, aedDevice.device_sn, aedDevice.location, aedDevice.battery_expiry_date, aedDevice.battery_lot_number, aedDevice.manufacturing_date, aedDevice.manufacturing_lot_number, aedDevice.main_account_id, aedDevice.sub_account_id, aedDevice.version], 
                (err) => {
                  if (err) {
                    console.error('Error inserting AED device:', err);
                  }
                });
            });
          });

          res.status(200).send(aedDevices); // return the AED devices
        });
    });
  });
});


// get products uploaded by a sub account
app.get('/sub/:subAccountId/products/latest', (req, res) => {
  const subAccountId = req.params.subAccountId;

  // inquery the latest version of products
  const query = `
    SELECT p1.*
    FROM products p1
    INNER JOIN (
      SELECT name, MAX(version) AS latestVersion
      FROM products
      WHERE sub_account_id = ?
      GROUP BY name
    ) p2 ON p1.name = p2.name AND p1.version = p2.latestVersion
    WHERE p1.sub_account_id = ?
  `;

  db.all(query, [subAccountId, subAccountId], (err, rows) => {
    if (err) {
      return res.status(500).send('Error retrieving latest products.');
    }
    res.json(rows);
  });
});

// get all AED devices uploaded by a sub account
app.get('/sub/:subAccountId/aed-devices/latest', (req, res) => {
  const subAccountId = req.params.subAccountId;

  // inquery the latest version of products
  const query = `
    SELECT p1.*
    FROM aed_devices p1
    INNER JOIN (
      SELECT model_name, MAX(version) AS latestVersion
      FROM aed_devices
      WHERE sub_account_id = ?
      GROUP BY model_name
    ) p2 ON p1.model_name = p2.model_name AND p1.version = p2.latestVersion
    WHERE p1.sub_account_id = ?
  `;

  db.all(query, [subAccountId, subAccountId], (err, rows) => {
    if (err) {
      return res.status(500).send('Error retrieving latest AED devices.');
    }
    res.json(rows);
  });
});

// update a specific product
app.post('/sub/:subAccountId/products/update/:name', (req, res) => {
  const subAccountId = req.params.subAccountId;
  console.log('Updating product:', req.body);
  const { id, name, sku, on_hand_quantity, used_quantity, days_on_hand, expiry_date, location, main_account_id, sub_account_id } = req.body;

  // get the latest version of the product
  db.get(`SELECT MAX(version) AS latestVersion FROM products WHERE name = ? AND sub_account_id = ?`, [name, subAccountId], (err, row) => {

    const latestVersion = row.latestVersion;
    newVersion = latestVersion + 1;

    // insert the new version of the product
    db.run(`INSERT INTO products (name, sku, on_hand_quantity, used_quantity, days_on_hand, expiry_date, location, main_account_id, sub_account_id, version, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [name, sku, on_hand_quantity, used_quantity, days_on_hand, expiry_date, location, main_account_id, subAccountId, newVersion], 
      (err) => {
        if (err) {
          return res.status(500).send('Error updating product.');
        }
        res.status(200).send('Product updated successfully.');
      });
  });
});

// update a specific AED device
app.post('/sub/:subAccountId/aed-devices/update/:model_name', (req, res) => {
  const subAccountId = req.params.subAccountId;
  console.log('Updating AED device:', req.body);
  const { id, model_name, device_sn, location, battery_expiry_date, battery_lot_number, manufacturing_date, manufacturing_lot_number, main_account_id, sub_account_id } = req.body;

  // get the latest version of the AED device
  db.get(`SELECT MAX(version) AS latestVersion FROM aed_devices WHERE model_name = ? AND sub_account_id = ?`, [model_name, subAccountId], (err, row) => {

    const latestVersion = row.latestVersion;
    newVersion = latestVersion + 1;

    // insert the new version of the AED device
    db.run(`INSERT INTO aed_devices (model_name, device_sn, location, battery_expiry_date, battery_lot_number, manufacturing_date, manufacturing_lot_number, main_account_id, sub_account_id, version, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [model_name, device_sn, location, battery_expiry_date, battery_lot_number, manufacturing_date, manufacturing_lot_number, main_account_id, subAccountId, newVersion], 
      (err) => {
        if (err) {
          return res.status(500).send('Error updating AED device.');
        }
        res.status(200).send('AED device updated successfully.');
      });
  });
});

// delete a specific product
app.delete('/sub/:subAccountId/products/delete/:name', (req, res) => {
  const subAccountId = req.params.subAccountId;
  const name2del = req.params.name;
  console.log('Deleting product:', name2del);

  // delete all versions of the product
  db.run(`DELETE FROM products WHERE name = ? AND sub_account_id = ?`, [name2del, subAccountId], (err) => {
    if (err) {
      return res.status(500).send('Error deleting product.');
    }
    res.status(200).send('Product deleted successfully.');
  });
});

// delete a specific AED device
app.delete('/sub/:subAccountId/aed-devices/delete/:model_name', (req, res) => {
  const subAccountId = req.params.subAccountId;
  const model_name2del = req.params.model_name;
  console.log('Deleting AED device:', model_name2del);

  // delete all versions of the AED device
  db.run(`DELETE FROM aed_devices WHERE model_name = ? AND sub_account_id = ?`, [model_name2del, subAccountId], (err) => {
    if (err) {
      return res.status(500).send('Error deleting AED device.');
    }
    res.status(200).send('AED device deleted successfully.');
  });
});

// match id with username
app.get('/match/:id', (req, res) => {
  const userId = req.params.id;

  db.get(`SELECT username FROM users WHERE id = ?`, [userId], (err, row) => {
    if (err) {
      return res.status(500).send('Error retrieving username.');
    }
    res.status(200).send(row);
  });
});