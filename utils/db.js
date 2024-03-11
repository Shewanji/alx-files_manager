const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    this.database = process.env.DB_DATABASE || 'files_manager';
    const uri = `mongodb://${host}:${port}`;

    this.client = new MongoClient(uri, { useUnifiedTopology: true });
    this.connect();
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('Connected to MongoDB');
      this.db = this.client.db(process.env.DB_DATABASE || 'files_manager');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
    }
  }

  async isAlive() {
    return !!this.client && this.client.isConnected();
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
