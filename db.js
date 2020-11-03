const url = 'mongodb+srv://dbUser:dbUserPassword@cluster0.uune5.mongodb.net/store_db?retryWrites=true&w=majority';
//const axios = require('axios');
const mongoose = require('mongoose');
const AircraftModel = require('./Aircraft');
const UserModel = require('./User')

let database;


// axios header config
// const config = {
//     headers: {
//         'X-Api-Key': '8d3bac79-c4b0-4b44-9ee0-dc8b08e5f40f',
//     }
// }

const initDataBase = async () => {
    const database = await mongoose.connect(url);

    if (database) {
        console.log('Successfully connected to db');
    } else {
        console.log('Error connecting to db');
    }
}

const initUsers = async () => {
    const users = [];
    const firstNames = ['John', 'Linda', 'Alesia', 'Jacob'];
    const lastNames = ['Miller', 'Michaelson', 'Schmitt', 'Taylor'];

    firstNames.forEach((firstName, index) => {
        const newUser = {
            firstName: firstName,
            lastName: lastNames[index]
        }
        users.push(newUser);
    })
    await UserModel.create(users);
}

const initAircrafts = async () => {
    const aircrafts = [];
    const aircraftNames = ['Cessna', 'Piper', 'Cessna 150', 'Helicopter'];
    aircraftNames.forEach((name, index) => {
        const newAC = {
            name: name
        }
        aircrafts.push(newAC);
    })
    await AircraftModel.create(aircrafts);
}

const populatedB = async () => {
    //await UserModel.deleteMany({});
    const collection = database.collection('users');
    //const result = await collection.insertMany([{ a: 1 }, { a: 2 }, { a: 3 }]);
    //console.log(`Succesfully inserted; ${JSON.stringify(result)}`);
}

const readDB = async  () => {
    const collection = database.collection('users');
    const docs = await collection.find({}).toArray();
    console.log(`Docs: ${JSON.stringify(docs)}`);
}
//an await means that any code that comes after this needs the code were waiting for
const init = async () => {
    await initDataBase();
    //await populatedB();
    readDB();
}

init();
