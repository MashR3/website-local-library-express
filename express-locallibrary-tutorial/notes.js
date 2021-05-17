// Create an Author object with escaped and trimmed data.
var author = new Author(
    {
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death
    });
author.save(function (err) {
    if (err) { return next(err); }
    // Successful - redirect to new author record.
    res.redirect(author.url);
});