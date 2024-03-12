const sha1 = require('sha1');

const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class UsersController {
  static async postNew(req, res) {
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
  }

  static async getMe(req, res) {
    try {
    // Retrieve token from request headers
      const token = req.headers['x-token'];

      console.log('Token:', token); // Log token value

      // If token not found, return unauthorized
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Retrieve user ID from Redis using token
      const userId = await redisClient.get(`auth_${token}`);

      console.log('User ID:', userId); // Log user ID retrieved from Redis

      // If user ID not found, return unauthorized
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Retrieve user from database using user ID
      const user = await dbClient.getUserById(userId);

      console.log('User:', user); // Log user retrieved from database

      // If user not found, return unauthorized
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Return user details
      return res.status(200).json({ email: user.email, id: user._id });
    } catch (error) {
      console.error('Error retrieving user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = UsersController;
