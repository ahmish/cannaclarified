var express = require('express');
var router = express.Router();
var url = require('url');
var airtable = require('airtable');

/* GET condition detail */
router.get('/:condition_name', function(req, res, next) {
    var condition_name = req.params.condition_name;
    db_search(condition_name, function(results) {
        console.log(results);
        if (Object.keys(results.condition).length == 0) {
            console.log('unknown condition', condition_name);
            res.status(404).send('Unknown condition');
        } else {
            res.render('condition', {
                title:     'CannaClarified',
                condition: results.condition,
                evidence:  results.evidence
            });
        }
    });
});

// Airtable doesn't support querying on joined tables so working around it for now. General approach is 
//   1) use search term (q) to look up conditions
//   2) use condition id to look up evidence
function db_search(condition_name, complete) {
    const db = airtable.base("app869zB8b6uHjyHS");

    var condition = {};
    var evidence  = [];

    var conditions_formula = `FIND(LOWER("${condition_name}"), LOWER(Description))`;
    console.log('conditions formula:', conditions_formula);

    db("conditions").select({filterByFormula: conditions_formula}).firstPage(function(error, records) {
        if (records == null || records.length == 0) {
            complete({condition: condition, evidence: evidence});
            return;
        } else if (records.length > 1) {
            throw new Error("expected 1 condition");
        }

        condition = {
            id:           records[0].get('ID'),
            description:  records[0].get('Description'),
            introduction: records[0].get('Introduction'),
            insights:     records[0].get('Insights_old'),
            references:   records[0].get('References').split('|')
        };

        console.log('condition:', condition);

        var evidence_formula = `FIND(${condition.id}, Condition)`;
        console.log('evidence formula:', evidence_formula);

        db("evidence").select({filterByFormula: evidence_formula}).firstPage(function(error, records) {
            if (records == null || records.length == 0) {
                complete({condition: condition, evidence: evidence});
                return;
            }

            records.forEach(function(record) {
                evidence.push({
                    author:      record.get('First Author'),
                    year:        record.get('Year published'),
                    design:      record.get('Study_design lookup'),
                    population:  record.get('Patient or Population'),
                    outcome:     record.get('Outcomes'),
                    problem:     record.get('Problem'),
                    sample_size: record.get('number_subjects_start'),
                    results:     record.get('Results'),
                    link:        record.get('DOI')
                });
            });

            console.log('evidence:', evidence);

            complete({condition: condition, evidence: evidence});
        });
    });

    // TODO
    //   - error handling for empty/null results
    //   - account for results that spill beyond "firstPage" (eg: results > 100)
    //   - expand current assumption that only conditions are being searched
    //   - move away from airtable for simpler querying, lower latency
}

module.exports = router;
