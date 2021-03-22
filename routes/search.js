var express = require('express');
var router = express.Router();
var url = require('url');
var airtable = require('airtable');

/* GET search results */
router.get('/', async function(req, res, next) {
    console.log('search query', req.query.q);
    var results = await db_search(req.query.q);
    console.log('search results', results);

    res.render('search', {
        title:      'CannaClarified',
        q:          req.query.q,
        conditions: results
    });
});

async function db_search(q) {
    const db = airtable.base("app869zB8b6uHjyHS");

    var results = {
        primary:   [],
        secondary: []
    };

    var conditions_formula = `OR(FIND(LOWER("${q}"), LOWER(Description)), FIND(LOWER("${q}"), LOWER(Synonyms)))`;
    console.log('conditions formula:', conditions_formula);

    var records = await db("conditions").select({filterByFormula: conditions_formula}).all();
    console.log('records', records.length);

    if (records == null || records.length == 0) {
        return results;
    }

    var related_conditions = [];

    records.forEach(function(r) {
        let condition = {
            id:           r.id,
            description:  r.get('Description'),
            introduction: r.get('Introduction'),
            insights:     r.get('Insights_highest'),
            evidence:     r.get('Related evidence') ? r.get('Related evidence').length : 0
        };
        results.primary.push(condition);

        related_conditions = related_conditions.concat(r.get('Related conditions'));
    });

    console.log('related conditions raw', related_conditions);

    // Reduce to unique conditions (not including primary)
    if (related_conditions.length > 0) {
        related_conditions = [...new Set(related_conditions)];

        results.primary.forEach(function(condition) {
            const index = related_conditions.indexOf(condition.id);
            if (index > -1) {
              related_conditions.splice(index, 1);
            }
        });
    }
    
    console.log('related conditions unique', related_conditions);

    if (related_conditions.length == 0) {
        return results;
    }

    conditions_formula = '';
    if (related_conditions.length == 1) {
        conditions_formula = `FIND(${related_conditions[0]}, ID)`;
    } else if (related_conditions.length > 1) {
        conditions_formula = "OR(";
        related_conditions.forEach((id) => {conditions_formula += `FIND("${id}", RECORD_ID()),`;});
        conditions_formula = conditions_formula.replace(/,+$/, ")");
    }

    console.log('conditions formula:', conditions_formula);

    records = await db("conditions").select({filterByFormula: conditions_formula}).all();
    console.log('records', records.length);

    if (records == null || records.length == 0) {
        return results;
    }

    records.forEach(function(r) {
        let condition = {
            id:           r.id,
            description:  r.get('Description'),
            introduction: r.get('Introduction'),
            insights:     r.get('Insights_highest'),
            evidence:     r.get('Related evidence') ? r.get('Related evidence').length : 0
        };
        results.secondary.push(condition);
    });

    console.log('results', results);

    return results;

    // TODO
    //   - error handling for empty/null results
    //   - account for results that spill beyond "firstPage" (eg: results > 100)
    //   - expand current assumption that only conditions are being searched
    //   - move away from airtable for simpler querying, lower latency
}

module.exports = router;
