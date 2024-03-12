import { MongoClient } from 'mongodb';
import sha1 from 'sha1';

const { ObjectId } = require('mongodb');

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    this.database = process.env.DB_DATABASE || 'files_manager';
    const uri = `mongodb://${host}:${port}`;

    this.client = new MongoClient(uri, { useUnifiedTopology: true });
    this.connected = false;
    this.connect();
  }

  async connect() {
    try {
      await this.client.connect();
      this.db = this.client.db(this.database);
      this.connected = true;
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
    }
  }

  isAlive() {
    return this.connected;
  }

  async insertUser(email, password) {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    // Check if the user already exists
    const existingUser = await this.db.collection('users').findOne({ email });
    if (existingUser) {
      throw new Error('Already exist');
    }

    // Hash the password using SHA1
    const hashedPassword = sha1(password);

    // Insert the new user into the users collection
    const result = await this.db.collection('users').insertOne({ email, password: hashedPassword });
    return result.ops[0];
  }

  async getUserByEmail(email) {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    // Retrieve the user by email from the users collection
    return this.db.collection('users').findOne({ email });
  }

  async getUserById(userId) {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    // Convert userId string to ObjectId
    const objectIdUserId = new ObjectId(userId);

    // Retrieve the user by ID from the users collection
    return this.db.collection('users').findOne({ _id: objectIdUserId });
  }

  async nbUsers() {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db.collection('users').countDocuments();
  }

  async nbFiles() {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db.collection('files').countDocuments();
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
