const jwt = require("jsonwebtoken");
require("dotenv").config();

function issueJWT(user) {
  const id = user.id;
  const expiresIn = "14d";
  const payload = {
    sub: id,
    iat: Date.now(),
  };
  const signedToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: expiresIn,
  });

  return {
    token: "Bearer " + signedToken,
    expires: expiresIn,
  };
}

module.exports = { issueJWT };
