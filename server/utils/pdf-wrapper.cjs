const fs = require('fs');

// Hack to prevent pdf-parse from running its test mode
const moduleParent = module.parent;
module.parent = module;
const pdf = require('pdf-parse');
module.parent = moduleParent;

module.exports = pdf;
