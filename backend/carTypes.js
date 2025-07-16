async function insertCarTypes() {
    const carTypes = [
      "H1", "هايس", "كوستر", "باص 28", "باص 33", "مرسيدس MCV500", "مرسيدس MCV600", "زفة", "النترا", "توسان", "سبورتاج", "ام جي", "mcv500", "mcv600", "wedding", "sportage"
    ];
    const { MongoClient } = require('mongodb');
    const client = await MongoClient.connect('mongodb+srv://innovati:1923036e@innovaticluster.fxm3i6t.mongodb.net');
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