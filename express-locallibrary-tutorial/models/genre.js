var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var GenreSchema = new Schema(
    {
        name: { type: String, minLength: 3, maxlength: 100, required: true}
    }
);

// Virtual for genre's instance URL
GenreSchema
.virtual('url')
.get(function() {
    return 'catalog/genre/' + this._id;
});

//Export model
module.exports = mongoose.model('GenreInstance', GenreSchema);