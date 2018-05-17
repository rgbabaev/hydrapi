const fs = require('fs');
const path = require('path');
const util = require('util');
const _ = require('lodash');
const MongoClient = require('mongodb').MongoClient;

const CONFIG_FILE_NAME = './config.json'
const CONFIG_PATH = path.join(__dirname, CONFIG_FILE_NAME);

const readLine = question => new Promise((resolve, reject) => {
  process.stdout.write(`${question} `);
  process.stdin.once('data', chunk => resolve(chunk.toString().slice(0, -1)));
});

// const confirm = question => new Promise((resolve, reject) => {
//   process.stdout.write(`${question}\nPress y to confirm `);
//   process.stdin.once('keypress', chunk => {
//     resolve(chunk);
//   });
// });

const fillConfig = async params => {
  const result = {};
  for (paramName of params) {
    result[paramName] = await readLine(`Set value of ${paramName}:`);
  }
  return result;
};

const isFileExists = async path => await util.promisify(fs.stat)(path)
  .then(data => !!data);

const mergeConfig = (config, newConfig) => ({
  ...config,
  ..._.omitBy(newConfig, val => !val)
});

const printFlatObject = object => {
  for (var key in object) console.log(`${key}: ${object[key]}`);
};

(async () => {
  let config = { PORT: 3000 };
  console.clear();

  try {
    if (await isFileExists(CONFIG_PATH)) {
      const data = await util.promisify(fs.readFile)(CONFIG_PATH);
      config = JSON.parse(data);

      console.log('Current config:');
      printFlatObject(config);
      console.log('\nЕсли вы не хотите изменять значение параметра, оставьте поле пустым\n');
    }
  } catch (err) {
    console.error('Can\'t read a config file\n', err.toString());
  }

  process.stdin.setEncoding('utf8');
  let newConfig = await fillConfig(['PORT', 'DBPATH', 'DBNAME']);
  newConfig = mergeConfig(config, newConfig);
  console.log('\nNew config:');
  printFlatObject(newConfig);
  try {
    await util.promisify(fs.writeFile)(CONFIG_PATH, JSON.stringify(newConfig));
  } catch (err) {
    console.error('Can\'t save new config\n', err.toString());
  }
  console.log('\nNew config saved\n');
  process.exit();

  // console.log('ss', await confirm('Save new config?'));
})();

/*
collectionNames = ['collection1', 'collection2', ...];

check db connection
if (db available)
  createCollections();
else {
  console.log('Invalid db requisites');
  requestParamsFromUser();
}

async requestParamsFromUser(propNames) {
  const params = await propNames.forEach(param => { param: userQuery() });
}

createCollections(db, collectionNames) {
  collectionNames.forEach(collectionName => {
    if(!collectionExist(collectionName)) {
      db.createCollection(collectionName);
    }
  });
}
*/
