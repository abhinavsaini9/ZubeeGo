const NodeGeocoder = require('node-geocoder');


require('dotenv').config();
const options = {
  provider: 'mapquest',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};

const geocoder = NodeGeocoder(options);

module.exports = geocoder;