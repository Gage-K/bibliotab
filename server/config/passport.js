const passport = require("passport");
const db = require("../db/queries");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
require("dotenv").config();

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.ACCESS_TOKEN_SECRET,
  algorithms: ["HS256"],
};

const strategy = new JwtStrategy(options, async (payload, done) => {
  try {
    const payloadId = payload.sub;

    const rows = await db.getUserById(payloadId);
    const user = rows[0];

    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  } catch (err) {
    done(err);
  }
});

module.exports = (passport) => {
  passport.use(strategy);
};
