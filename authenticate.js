var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var JwtStrategy = require('passport-jwt').Strategy;   // to use JwtStrategy
var ExtractJwt = require('passport-jwt').ExtractJwt;  //for etracting jwt from header
var jwt = require('jsonwebtoken');                    // used to create, sign, and verify tokens

var User = require('./models/user');
var config = require('./config.js');

// 1. LocalStrategy
exports.local = passport.use(new LocalStrategy(User.authenticate())); 
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//get/create token
exports.getToken = function(user) {    // user is payload of JWT which must include a member '_id'
    return jwt.sign(user, config.secretKey,
        {expiresIn: 3600});
};

// 2. JwtStrategy
var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

exports.jwtPassport = passport.use(new JwtStrategy(opts,              
    (jwt_payload, done) => {
        console.log("JWT payload: ", jwt_payload);
        User.findOne({_id: jwt_payload._id}, (err, user) => {
            if (err) {
                return done(err, false);
            }
            else if (user) {
                return done(null, user);
            }
            else {
                return done(null, false);
            }
        });
    }));

//verify token
exports.verifyUser = passport.authenticate('jwt', {session: false}); //session-less passport authrntication