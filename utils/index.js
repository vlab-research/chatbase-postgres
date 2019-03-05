function getRandomSeed() {
  return Math.floor(Math.random() * Math.floor(process.env.SEED || 100));
}

function validationError() {
  throw new TypeError('The database configuration object is strictly required!');
}

module.exports = {
  getRandomSeed,
  validationError
}