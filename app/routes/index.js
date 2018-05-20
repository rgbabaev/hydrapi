const version = require('./version');
const products = require('./products').route;
const productProperties = require('./productProperties').route;

module.exports = (app, db) => {
  version(app);
  products(app, db);
  productProperties(app, db);
};
