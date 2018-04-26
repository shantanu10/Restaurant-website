const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var Schema = mongoose.Schema;
var authenticate = require('../authenticate'); 
const cors = require('./cors');

var Favorites = require('../models/favorite');
var Dishes = require('../models/dishes');

const favoriteRouter = express.Router();
favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors,  authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({'postedBy': req.user._id})
    .populate('postedBy')
    .populate('dishes')
    .then((favorites) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    console.log(req.user._id);                                              // req.body is a list of json objects
    for(let j = 0;j < req.body.length; j++){
        console.log(req.body[j]._id);
        Favorites.find({'postedBy': req.user._id})
                .then((favorites) => {
                    if (favorites.length) {
                        var favoriteAlreadyExist = false;
                        if (favorites[0].dishes.length) {
                            for (var i = (favorites[0].dishes.length - 1); i >= 0; i--) {
                                favoriteAlreadyExist = favorites[0].dishes[i] == req.body[j]._id;
                                if (favoriteAlreadyExist) break;
                            }
                        }
                        if (!favoriteAlreadyExist) {
                            favorites[0].dishes.push(req.body[j]._id);
                            favorites[0].save()
                            .then((favorite)=> {
                                console.log('A dish is added in your favorites');
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(favorite);
                            },  (err) =>  next(err) );
                        } else {
                            console.log('Already exists in your favorites');
                            res.json(favorites);
                        }

                    } else {

                        Favorites.create({postedBy: req.user._id})
                        .then((favorite) => {
                            favorite.dishes.push(Schema.Types.ObjectId(req.body[j]._id));
                            favorite.save()
                            .then((favorite)=> {
                                console.log('A dish is added in your favorites');
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(favorite);
                            }, (err) =>  next(err) );
                        }, (err) => next(err));
                    }
                }, (err) => next(err))
                .catch((err) => next(err));
            }
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.remove({'postedBy': req.user._id})
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));    
});

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({postedBy: req.user._id})
    .then((favorites) => {
        if (!favorites) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.json({"exists": false, "favorites": favorites});
        }
        else {
            if (favorites.dishes.indexOf(req.params.dishId) < 0) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.json({"exists": false, "favorites": favorites});
            }
            else {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.json({"exists": true, "favorites": favorites});
            }
        }

    }, (err) => next(err))
    .catch((err) => next(err))
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    console.log(req.user._id);                                              // req.body is a list of json objects
    Favorites.find({'postedBy': req.user._id})
            .then((favorites) => {
                if (favorites.length) {
                    var favoriteAlreadyExist = false;
                    if (favorites[0].dishes.length) {
                        for (var i = (favorites[0].dishes.length - 1); i >= 0; i--) {
                            favoriteAlreadyExist = (favorites[0].dishes[i] == req.params.dishId);
                            if (favoriteAlreadyExist) break;
                        }
                    }
                    if (!favoriteAlreadyExist) {
                        favorites[0].dishes.push(mongoose.Types.ObjectId(req.params.dishId));
                        favorites[0].save()
                        .then((favorite)=> {
                            console.log('A dish is added in your favorites');
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite);
                        },  (err) =>  next(err) );
                    } else {
                        console.log('Already exists in your favorites');
                        res.send("Already exists in your favorites")
                        res.json(favorites);
                    }

                } else {

                    Favorites.create({postedBy: req.user._id})
                    .then((favorite) => {
                        favorite.dishes.push(mongoose.Types.ObjectId(req.params.dishId));
                        favorite.save()
                        .then((favorite)=> {
                            console.log('A dish is added in your favorites');
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite);
                        }, (err) =>  next(err) );
                    }, (err) => next(err));
                }
            }, (err) => next(err))
            .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req,res)=>{
    res.statusCode = 403;
    res.setHeader('Content-Type','text/plain');
    res.end('PUT operation not supported on /favorites/' + req.params.dishId);
})
.delete(cors.cors,  authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({postedBy:req.user._id}, (err, favorite)=>{
        if (err) return next(err);

        var index = favorite.dishes.indexOf(req.params.dishId);
        if ( index >=0 ){
            favorite.dishes.splice(index,1);
            favorite.save()
            .then((favorite) => {
                Favorites.findById(favorite._id)
                .populate('user')
                .populate('dishes')
                .then((favorite) => {
                    console.log('Favorite Dish Deleted!', favorite);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                })
            })
            .catch((err) => {
                return next(err);
            })
        }
        else{
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain');
            res.end('Dish '+ req.params._id + ' not in your favorite list!');
        }
    })
});


module.exports = favoriteRouter;