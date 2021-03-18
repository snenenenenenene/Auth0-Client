const express = require("express");
const { join } = require("path");
const path = require("path");
const app = express();
const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const jwtAuthz = require('express-jwt-authz');
const authConfig = require("./auth_config.json");
var fs = require('fs');


const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`
  }),

  audience: authConfig.audience,
  issuer: `https://${authConfig.domain}/`,
  algorithms: ["RS256"]
});


  
app.get("/api/external", checkJwt, (req, res) => {
  fs.readFile("api/external.json", function read(err, data) {   
    var products = JSON.parse(data).products;
    console.log(products);
    res.send(products);
  })
});

app.get('/api/public', function(req, res) {
  res.json({
    message: 'Hello from a public endpoint! You don\'t need to be authenticated to see this.'
  });
});

app.get('/api/products', checkJwt, function(req, res) {
  res.json({
    message: 'Hello from a private endpoint! You need to be authenticated to see this.'
  });
});

const checkScopes = jwtAuthz([ 'read:products' ]);

app.get('/api/read-products', checkJwt, checkScopes, function(req, res) {
  res.json({
    message: 'this is a product list'
  });
});

// Serve static assets from the /public folder
app.use(express.static(join(__dirname, "public")));

// Endpoint to serve the configuration file
app.get("/auth_config.json", (req, res) => {
  res.sendFile(join(__dirname, "auth_config.json"));
});

app.use("/public", express.static(path.resolve(__dirname, "public")));

// Serve the index page for all other requests
app.get("/*", (_, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

app.use(function(err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    return res.status(401).send({ msg: "Invalid token" });
  }

  next(err, req, res);
});

// Listen on port 3000
app.listen(3000, () => console.log("Application running on port 3000"));