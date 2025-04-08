const passport = require("passport");
const db = require("../db/queries");
const bcrypt = require("bcryptjs");
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

// LOCAL STRATEGY

/*

// all strategies need a verify callback

const verifyCallback = async (username, password, done) => {
  // done represents a function that you pass the results of authentication to
  // username & password is what we expect in request body of some form
  // passport takes these fields and populates them in the verify callback & must be called 'username' and 'password'
  // return values of done must be what passport expects -- that's what really matters here
  try {
    const rows = await db.getUserByUsername(username);
    const user = rows[0];

    if (!user) {
      return done(null, false, { message: "Incorrect username" }); // means "no error (null) but not a user (false)"
    }
    const pwData = await db.getUserPassword(user.id);
    const currentPassword = pwData[0].password;
    const isValid = await bcrypt.compare(password, currentPassword);

    if (isValid) {
      return done(null, user); // means "no errror and here's a user"
    } else {
      return done(null, false);
    }
  } catch (err) {
    done(err);
  }
};

const strategy = new LocalStrategy(verifyCallback);

passport.use(strategy);

// this has to do with putting a user into and out of a session; we put user id into the session and find it in the database

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const rows = await db.getUserById(id);
    const user = rows[0];

    done(null, user);
  } catch (err) {
    done(err);
  }
});
*/
