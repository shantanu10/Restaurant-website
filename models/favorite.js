var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var favoriteSchema = new Schema({
    postedBy:{
        type:Schema.Types.ObjectId,
        required:true,
        ref: 'User'
    },
    dishes:[{
        type:Schema.Types.ObjectId,
        ref:'Dish'
    }]
},
    {
        timestamps:true
    }
);

var Favorites = mongoose.model('Favorite', favoriteSchema);
module.exports = Favorites;