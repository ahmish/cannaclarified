var express = require('express');
var router = express.Router();
var url = require('url');
var airtable = require('airtable');

/* GET conditions listing */
router.get('/', function(req, res, next) {
    db_search(function(results) {
        res.render('conditions', {
            title:      'CannaClarified',
            conditions: results
        });
    });
});

function db_search(complete) {
    const db = airtable.base("app869zB8b6uHjyHS");

    var conditions = [];

    db("conditions").select({fields: ["Description"], sort: [{field: "Description"}]}).firstPage(function(error, records) {
        if (records == null || records.length == 0) {
            throw "expected at least 1 condition in db";
        }

        conditions = records.map((r) => r.get('Description'));
        console.log('conditions:', conditions);

        complete(conditions);
    });

    // TODO
    //   - account for results that spill beyond "firstPage" (eg: results > 100)
}

module.exports = router;
