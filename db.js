const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb+srv://dbUser:dbUserPassword@cluster0.uune5.mongodb.net/store_db?retryWrites=true&w=majority';
const client = new MongoClient(url, { useNewUrlParser: true });
const dbName = 'store_db';

let database;

const initDataBase = async () => {
    const connection = await client.connect();

    if (connection) {
        console.log('Successfully connected to db');
        database = client.db(dbName);
    } else {
        console.log('Error connecting to db');
    }
}

const populatedB = async () => {
    const collection = database.collection('users');
    //const result = await collection.insertMany([{ a: 1 }, { a: 2 }, { a: 3 }]);
    //console.log(`Succesfully inserted; ${JSON.stringify(result)}`);
}

const readDB = async  () => {
    const collection = database.collection('users');
    const docs = await collection.find({});
    console.log(`Docs: ${JSON.stringify(docs)}`);
}
//an await means that any code that comes after this needs the code were waiting for
const init = async () => {
    await initDataBase();
    //await populatedB();
    readDB();
}

init();
