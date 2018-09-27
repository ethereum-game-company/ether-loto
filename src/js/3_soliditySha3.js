/*
 Code taken from web3.js.
 */
/**
 * @file soliditySha3.js
 * @author Níckolas Goline <n@ngoline.com>
 * @date 2018-09-10
 */

var solidityPackString = str => {
  str = utf8.encode(str);
  var hex = "";

  // remove \u0000 padding from either side
  str = str.replace(/^(?:\u0000)*/,'');
  str = str.split("").reverse().join("");
  str = str.replace(/^(?:\u0000)*/,'');
  str = str.split("").reverse().join("");

  for(var i = 0; i < str.length; i++) {
      var code = str.charCodeAt(i);
      // if (code !== 0) {
      var n = code.toString(16);
      hex += n.length < 2 ? '0' + n : n;
      // }
  }

  return "0x" + hex;
};

/**
 * Hashes solidity values to a sha3 hash using keccak 256
 *
 * @method soliditySha3
 * @return {Object} the sha3
 */
var soliditySha3 = str => {
  var hexString = solidityPackString(str).toString('hex');
  return web3.sha3('0x' + hexString);
};