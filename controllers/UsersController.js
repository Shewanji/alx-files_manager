import sha1 from 'sha1';

const dbClient = require('../utils/db');

const UsersController = {
  async postNew(req, res) {
    try {
      // Extract email and password from request body
      const { email, password } = req.body;

      // Check if email is missing
      if (!email) {
        return res.status(400).json({ error: 'Missing email' });
      }

      // Check if password is missing
      if (!password) {
        return res.status(400).json({ error: 'Missing password' });
      }

      // Check if email already exists in DB
      const existingUser = await dbClient.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      // Hash the password using SHA1
      const hashedPassword = sha1(password);

      // Insert the new user into the database
      const newUser = await dbClient.insertUser(email, hashedPassword);

      // Return the new user with email and id only
      return res.status(201).json({ email: newUser.email, id: newUser._id });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};

module.exports = UsersController;
