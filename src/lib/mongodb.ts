import { MongoClient } from 'mongodb';

// Use environment variables for connection string
const uri = process.env.MONGO_DB_URL || '';
const dbName = 'quotient'; 

// For debugging - log connection status but never the actual connection string
console.log('Initializing MongoDB connection...');

if (!uri) {
  console.error('MongoDB connection string is missing! Check your environment variables.');
}

// Create MongoDB client with options
const client = new MongoClient(uri);

// Create a cached connection promise
let clientPromise: Promise<MongoClient>;

// Add this type declaration to ensure typescript understands the global variable
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    console.log('Creating new MongoDB connection in development mode...');
    global._mongoClientPromise = client.connect()
      .then(client => {
        console.log('MongoDB connected successfully!');
        return client;
      })
      .catch(err => {
        console.error('Failed to connect to MongoDB:', err);
        throw err;
      });
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  clientPromise = client.connect()
    .then(client => {
      console.log('MongoDB connected successfully!');
      return client;
    });
}

// Export the client promise for use in your API routes
export default clientPromise;

// Helper function to get a database connection
export async function getDatabase() {
  try {
    const client = await clientPromise;
    return client.db(dbName);
  } catch (error) {
    console.error('Error getting database connection:', error);
    throw error;
  }
}

// Helper function to run a query with a database connection
export async function runQuery(collection: string, query: Function) {
  const db = await getDatabase();
  return await query(db.collection(collection));
}

