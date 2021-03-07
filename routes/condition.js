var express = require('express');
var router = express.Router();
var url = require('url');
var airtable = require('airtable');

/* GET condition detail */
router.get('/:condition_name', function(req, res, next) {
    var condition_name = req.params.condition_name;
    db_search(condition_name, function(results) {
        res.render('condition', {
            title:     'CannaClarified',
            condition: results
        });
    });
});

function db_search(condition_name, complete) {
    complete({description: condition_name});
}

module.exports = router;
