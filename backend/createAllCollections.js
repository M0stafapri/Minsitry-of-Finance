const { MongoClient } = require('mongodb');
async function run() {
  const client = await MongoClient.connect('mongodb+srv://innovati:1923036e@innovaticluster.fxm3i6t.mongodb.net', {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    retryWrites: true,
    retryReads: true
  });
  const db = client.db('test');
  const collections = [
    'employees',
    'suppliers',
    'customers',
    'trips',
    'cartypes',
    'auditlogs',
    'blacklistedtokens'
  ];
  for (const col of collections) {
    await db.collection(col).insertOne({ dummy: true });
    console.log(`Inserted dummy doc into ${col}`);
  }
  await client.close();
}
run();

// Add this to insert all frontend car types
async function insertCarTypes() {
  const carTypes = [
    "H1", "هايس", "كوستر", "باص 28", "باص 33", "مرسيدس MCV500", "مرسيدس MCV600", "زفة", "النترا", "توسان", "سبورتاج", "ام جي", "mcv500", "mcv600", "wedding", "sportage"
  ];
  const { MongoClient } = require('mongodb');
  const client = await MongoClient.connect('mongodb+srv://innovati:1923036e@innovaticluster.fxm3i6t.mongodb.net', {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    retryWrites: true,
    retryReads: true
  });
  const db = client.db('test');
  const collection = db.collection('cartypes');
  for (const name of carTypes) {
    const exists = await collection.findOne({ name });
    if (!exists) {
      await collection.insertOne({ name });
      console.log(`Inserted car type: ${name}`);
    } else {
      console.log(`Car type already exists: ${name}`);
    }
  }
  await client.close();
}

insertCarTypes();