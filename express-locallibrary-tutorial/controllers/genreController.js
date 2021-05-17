var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');
const { body, validationResult } = require('express-validator');
// Note: This syntax allows us to use body and validationResult as the associated middleware functions

// Display list of all Genre.
exports.genre_list = function(req, res) {
    Genre.find({}, 'name') 
        .sort([['name', 'ascending']])
        .exec(function (err, list_genres) {
        if (err) { return next(err); }
        //Successful, so render
        res.render('genre_list', { title: 'Genre List', genre_list: list_genres });
      });};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {

    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
              .exec(callback);
        },

        genre_books: function(callback) {
            Book.find({ 'genre': req.params.id })
              .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre==null) { // No results.
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books } );
    });

};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res, next) {
    res.render('genre_form', {title: 'Create Genre'});
};

// Handle Genre create on POST.
// THE CONTROLLER SPECIFIES AN ARRAY OF MIDDLEWARE FUNCTIONS!
// The array is passed to the router function and each method is called in order.
// NOTE: This approach is needed, because the validators are middleware functions.
exports.genre_create_post = [

    // Validate and sanitise the name field.
    body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(), // METHOD 1: body validator
    // Trim removes trailing/leading whitespace, checks name isn't empty, then escape() to remove dangerous HTML chars

    // Method 2: created middleware fn to EXTRACT any validation errors. If errors, render form again with sanitised genre obj and array of error messages
    // Process request after validation and sanitisation.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a genre object with escaped and trimmed data.
        var genre = new Genre(
            { name: req.body.name }
        );

        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages
            res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array()});
            return;
        }
        else {
            // Data from form is valid
            // Check if Genre with same name already exists.
            Genre.findOne({ 'name': req.body.name})
            .exec( function(err, found_genre ) {
                if (err) { return next(err); }

                if (found_genre) {
                    //Genre exists, redirect to its detail page.
                    res.redirect(found_genre.url);
                }
                else {

                    genre.save(function (err) {
                        if (err) { return next(err); }
                        // Genre saved. Redirect to genre page.
                        res.redirect(genre.url);
                    })
                }
            });
        }
    }
];

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res, next) {
    
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
              .exec(callback);
        },
        // genre: ()=> {Genre.findById(req.params.id).exec()},

        genre_books: function(callback) {
            Book.find({'genre': req.params.id})
                .exec(callback);

        }
    },
    function(err, results) {
        if (err) { return next(err); }
        if (results.genre==null) { // no genre exists
            res.redirect('/genres');
        }

        res.render('genre_delete', { title: 'Genre', genre: results.genre, genre_books: results.genre_books} );
    });
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res) {
    
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.body.id)
                .exec(callback);
        },
        genre_books: function(callback) {
            Book.find({'genre': req.body.id})
                .exec(callback);
        }
    },
    function(err, results) {
        if (err) { return next(err); }
        // Success
        if (results.genre_books.length > 0) {
            // Genre has books. Render in same way as for GET route.
            res.render('genre_delete', { title: 'Genre', genre: results.genre, genre_books: results.genre_books} );
            return;
        }
        else {
            Genre.findByIdAndDelete(req.body.genreid, function deleteGenre(err) {
                if (err) { return next(err); }
                // Success so redirect
                res.redirect('/catalog/genres');
            });
        }
    });
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res, next) {

    Genre.findById(req.params.id, function(err, genre) {
        if (err) { return next(err); }
        if(genre==null) {
            var err = new Error('Genre not found');
            err.status = 404;
        }
        res.render('genre_form', {title: 'Update Genre', genre: genre});
    });
};

// Handle Genre update on POST.
exports.genre_update_post = [
    
    body('name').trim().isLength({ min: 1 }).withMessage('Must not be empty').escape(),

    (req, res, next) => {
        const errors = validationResult(req)

        genre = new Genre({
            name: req.body.name,
            _id: req.params.id
        });

        if(!errors.isEmpty()) {
            res.render('genre_form', { title: 'Update Genre', genre: genre })
            return ;
        }

        Genre.findByIdAndUpdate(req.params.id, genre, {}, function (err, thegenre) {
            if (err) { return next(err); }
            // Successful - redirect to genre detail page.
            res.redirect(thegenre.url);
        });
    }
]