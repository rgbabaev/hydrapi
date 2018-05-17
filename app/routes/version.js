module.exports = app => {
  app.get('/version', (req, res) => {
    res.send(JSON.stringify({
      path: process.execPath,
      version: process.version,
      platform: process.platform,
    }));
  });
};
