const express = require('express');
const path = require('path');
const port = 5025;
const fs = require('fs');
const app = express();
const cookieParser = require('cookie-parser');
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use(
	express.json(),
	express.urlencoded({
		extended: true,
  }));

app.use(express.static(path.join(__dirname, 'public')));


function checkAuth(req, res, next) {
  if (req.cookies.isLoggedIn) {
      next(); //check cookie if yes , pass
  } else {
      res.status(401).send('Please Login first.'); 
  }
}

app.get('/', (req, res) => {
    console.log('Get body:', req.body);
  res.sendFile(path.join(__dirname,'public', 'home.html'));
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname,'public', 'home.html'));
});


app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname,'public', 'login.html'));
});

app.get('/find_a_pet', (req, res) => {
  res.sendFile(path.join(__dirname,'public', 'find_cat_or_dog.html'));
});

app.get('/createAccount', (req, res) => {
  console.log('Get body:', req.query);
  res.sendFile(path.join(__dirname,'public', 'register.html'));
});

app.get('/pet_giveaway', (req, res) => {
  res.sendFile(path.join(__dirname,'public', 'pet_give_away_pet.html'));
});

app.get('/dog_care', (req, res) => {
  res.sendFile(path.join(__dirname,'public', 'dog_care.html'));
});

app.get('/cat_care', (req, res) => {
  res.sendFile(path.join(__dirname,'public', 'cat_care.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname,'public', 'contact.html'));
});


app.post('/', (req, res) => {
  console.log('Got body:', req.body);
  res.send("Received your request! Name: " + req.body.username);
});



// Handle login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Check username and password
  fs.readFile('login.txt', 'utf8', (err, data) => {
      if (err) {
          return res.status(500).send("Internal Server Error");
      }

      const userEntries = data.trim().split('\n');
      const isAuthenticated = userEntries.some(entry => {
          const [savedUsername, savedPassword] = entry.split(':');
          return savedUsername === username && savedPassword === password;
      });

      if (isAuthenticated) {
        console.log("Loged in")
        res.cookie('username', username, { httpOnly: false, maxAge: 900000 });
        res.cookie('isLoggedIn', true, { httpOnly: false, maxAge: 900000 });
        res.redirect('/home');
        
      } else {
          res.status(401).json({ message: "Invalid username or password" });
      }
  });
});

// Handle account creation
app.post('/createAccount', (req, res) => {
  const { username, password } = req.body; // body-parser middleware lets us use req.body

  // Validate username and password format
  const usernameRegex = /^[A-Za-z0-9]+$/;
  const passwordRegex = /(?=.*[A-Za-z])(?=.*\d).{4,}/;

  if (!usernameRegex.test(username)) {
      return res.status(400).send("Username can contain letters (both upper and lower case) and digits only.");
  }

  if (!passwordRegex.test(password)) {
      return res.status(400).send("Password must be at least 4 characters long, have at least one letter and at least one digit.");
  }

  // Check if username already exists
  fs.readFile('login.txt', 'utf8', (err, data) => {
      if (err) {
          return res.status(500).send("Internal Server Error");
      }

      const existingUsernames = data.split('\n').map(line => line.split(':')[0]);
      if (existingUsernames.includes(username)) {
          return res.status(409).send("Username already exists. Please choose a different one.");
          
      }

      // Write new username and password
      const newUserEntry = `${username}:${password}\n`;
      fs.appendFile('login.txt', newUserEntry, 'utf8', (err) => {
          if (err) {
              return res.status(500).send("Internal Server Error");
          }

          res.status(201).send("Account successfully created. You are now ready to login.");
          res.sendFile(path.join(__dirname,'public', 'login.html'));
      });
  });
});

app.get('/logout', (req, res) => {
  // Clear the cookies. The parameters should match those used when setting the cookies
  res.clearCookie('username');
  res.clearCookie('isLoggedIn');
  // Redirect the user to the login page or home page after logging out
  res.redirect('/login');
});

app.post('/pet_giveaway', (req, res) => {
  const { pet_type, breed, age, gender, suitable_for_family, along_with_dogs, along_with_cats, owner_name, owner_email, comments } = req.body;
  const user_name = req.cookies.username;
  console.log("Get the pet information");

  // Read the file to get the current count
  fs.readFile('pets.txt', 'utf8', (err, data) => {
      if (err) {
          console.error(err);
          return res.status(500).send("Internal Server Error");
      }

      // Increment the counter based on the number of lines (each line is a pet entry)
      const counter = data.trim() ? data.trim().split('\n').length + 1 : 1;

      // Create the new pet entry string
      const newEntry = `${counter}:${user_name}:${pet_type}:${breed}:${age}:${gender}:${suitable_for_family}:${along_with_dogs}:${along_with_cats}:${owner_name}:${owner_email}:${comments}\n`;

      // Append the new entry to the file
      fs.appendFile('pets.txt', newEntry, 'utf8', (err) => {
          if (err) {
              console.error(err);
              return res.status(500).send("Internal Server Error");
          }
          
          res.send(`
      <p>Pet added successfully!</p>
      <a href="/home">Go back to home page.</a>`);
      });
      
  });
});

app.post('/find_cat_or_dog', (req, res) => {
  const { pet_type, breed, age, gender, preferences } = req.body;

  fs.readFile('pets.txt', 'utf8', (err, data) => {
      if (err) {
          console.error(err);
          return res.status(500).send("Internal Server Error");
      }

      const petEntries = data.trim().split('\n');
      const filteredPets = petEntries.map(entry => entry.split(':')).filter(parts => {
          if (pet_type && parts[2] !== pet_type) return false;
          if (breed !== "any" && parts[3] !== breed) return false;
          if (age !== "any" && parts[4] !== age) return false;
          if (gender !== "any" && parts[5] !== gender) return false;

          const compatibility = parts[7].split(',');
          if (preferences.other_dogs === 'yes' && compatibility[0] !== 'yes') return false;
          if (preferences.other_cats === 'yes' && compatibility[1] !== 'yes') return false;
          if (preferences.small_children === 'yes' && parts[6] !== 'yes') return false;

          return true;
      });

      // 确保每个filteredPet是数组
      const outputPets = filteredPets.map(parts => {
          if (Array.isArray(parts)) {
              return parts.join(':');
          } else {
              console.error('Expected parts to be an array, but got:', parts);
              return 'Invalid pet data';
          }
      });

      res.json(outputPets);
  });
});



app.listen(port, () => {
  console.log(`Example app listening on port http://soen287.encs.concordia.ca:${port}`);
});
