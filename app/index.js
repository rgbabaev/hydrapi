const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;

const { PORT, DBPATH, DBNAME } = require('./config.json');
const routes = require('./routes');

const app = express();
const api = express();

api.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

api.use(bodyParser.json());
api.use((req, res, next) => {
  const { method, originalUrl, client: { remoteAddress, remotePort } } = req;
  console.log(`${method} ${originalUrl} from ${remoteAddress}:${remotePort}`);
  next();
});

app.use('/api', api);
app.use(express.static('front/build'));

MongoClient.connect(`${DBPATH}/${DBNAME}`, (err, client) => {
  if (err) throw err;
  const db = client.db(DBNAME);
  routes(api, db);
  api.use((err, req, res, next) => {
    if (err instanceof Error) {
      // TODO: add different statuses
      res.status(500);
      res.send(JSON.stringify({ error: err.toString() }));
      console.error(err);
    }
  });
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}!`));
});
