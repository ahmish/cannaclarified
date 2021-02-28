var express = require('express');
var router = express.Router();
var url = require('url');
var airtable = require('airtable');

/* GET search results */
router.get('/', function(req, res, next) {
	console.log('query', req.query);
	db_search(req.query.q, function(results) {
		res.render('search', { 
	    	title:   'CannaClarified',
	    	q: 		 req.query.q,
	    	results: results
		});
	});
});

// Airtable doesn't support querying on joined tables so working around it for now. General approach is 
//   1) use search term (q) to look up conditions
//   2) use condition id to look up evidence
function db_search(q, complete) {
	const db = airtable.base("app869zB8b6uHjyHS");

	var formula = `OR(FIND(LOWER("${q}"), LOWER(Description)), FIND(LOWER("${q}"), LOWER(Synonyms)))`;
	console.log('formula', formula);

	var conditions = db("conditions").select({filterByFormula: formula});
	var condition_ids = [];
	var results = [];

	conditions.firstPage(function(error, records) {
		if (records == null || records.length == 0) {
			complete(results);
		}

	    records.forEach(function(record) {
    	    console.log('condition', record.get('Description'));
    	    condition_ids.push(record.get('ID'));
    	});

    	console.log('condition ids', condition_ids);
    	if (condition_ids.length == 0) {
			throw "expected at least 1 condition id";
		}

    	condition_ids.forEach(function(id) {
			const evidence = db("evidence").select({filterByFormula: `FIND(${id}, Condition)`});
			console.log('two', `FIND(${id}, Condition)`);
			evidence.firstPage(function(error, records) {
				if (records == null || records.length == 0) {
					complete(results);
				}

			    records.forEach(function(record) {
		    	    results.push({
		    	    	title:   record.get('Study Title'),
						authors: record.get('First Author'),
						journal: record.get('Journal'),
						summary: record.get('Summary')
		    	    });
		    	});

		    	console.log('evidence', results);

		    	complete(results);
		    });
		});
	});

	// TODO
	//   - error handling for empty/null results
	//   - account for results that spill beyond "firstPage" (eg: results > 100)
	//   - expand current assumption that only 1 condition is found by search
	//   - expand current assumption that only conditions are being searched
	//   - move away from airtable for simpler querying, lower latency
}

module.exports = router;
