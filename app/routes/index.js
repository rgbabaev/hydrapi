const version = require('./version');
const products = require('./products').route;

module.exports = (app, db) => {
  version(app);
  products(app, db);
};
