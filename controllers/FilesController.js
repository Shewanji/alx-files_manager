import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
  static async postUpload(req, res) {
    try {
      const token = req.header('X-Token');
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      // Extract file information from request body
      const {
        name, type, parentId, isPublic, data,
      } = req.body;

      // Validate input
      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }

      if (!['folder', 'file', 'image'].includes(type)) {
        return res.status(400).json({ error: 'Missing type' });
      }

      if (type !== 'folder' && !data) {
        return res.status(400).json({ error: 'Missing data' });
      }

      // Retrieve parent from database
      if (parentId) {
        const parent = await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) });
        if (!parent) {
          return res.status(400).json({ error: 'Parent not found' });
        }

        if (parent.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      // Generate local path
      const localPath = path.join(FOLDER_PATH, `${uuidv4()}-${name}`);

      // Create local path if it does not exist
      if (!fs.existsSync(path.dirname(localPath))) {
        fs.mkdirSync(path.dirname(localPath), { recursive: true });
      }

      // Save file to local path
      if (type !== 'folder') {
        fs.writeFileSync(localPath, data, 'base64');
      }

      // Save file to database
      const file = {
        userId,
        name,
        type,
        isPublic,
        parentId,
        localPath,
      };

      const result = await dbClient.db.collection('files').insertOne(file);
      file._id = result.insertedId;

      // Return file
      return res.status(201).json(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getShow(req, res) {
    try {
      const token = req.headers['x-token'];
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(req.params.id), userId });

      if (!file) return res.status(404).json({ error: 'Not found' });

      return res.json(file);
    } catch (error) {
      console.error('Error retrieving file:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getIndex(req, res) {
    try {
      const token = req.headers['x-token'];
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      const userIdString = await redisClient.get(`auth_${token}`);
      if (!userIdString) return res.status(401).json({ error: 'Unauthorized' });

      const parentId = req.query.parentId ? ObjectId(req.query.parentId) : '0';
      const userId = ObjectId(userIdString);
      const filesCount = await dbClient.db.collection('files')
        .countDocuments({ userId, parentId });

      if (filesCount === '0') return res.json([]);

      const skip = (parseInt(req.query.page, 10) || 0) * 20;
      const files = await dbClient.db.collection('files').aggregate([
        { $match: { userId, parentId } },
        { $skip: skip },
        { $limit: 20 },
      ]).toArray();

      return res.json(files);
    } catch (error) {
      console.error('Error retrieving files:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = FilesController;
