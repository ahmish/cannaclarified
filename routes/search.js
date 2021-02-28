var express = require('express');
var router = express.Router();
var url = require('url');
var airtable = require('airtable');

/* GET search results */
router.get('/', function(req, res, next) {
	console.log('pre db_search for', req.query.q);
	db_search(req.query.q, function(results) {
		console.log("post db_search for", req.query.q)
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

	var condition_ids = [];
	var results = [];

	var conditions_formula = `OR(FIND(LOWER("${q}"), LOWER(Description)), FIND(LOWER("${q}"), LOWER(Synonyms)))`;
	console.log('conditions formula:', conditions_formula);

	db("conditions").select({filterByFormula: conditions_formula}).firstPage(function(error, records) {
		if (records == null || records.length == 0) {
			complete(results);
			return;
		}

		condition_ids = records.map((r) => r.get('ID'));

    	console.log('conditions:', condition_ids, records.map((r) => r.get('Description')));

    	if (condition_ids.length == 0) {
			throw "expected at least 1 condition id";
		}

		var evidence_formula = '';
    	condition_ids.forEach(function(id) {
			if (condition_ids.length == 1) {
				evidence_formula = `FIND(${id}, Condition)`;
			} else {
				evidence_formula = "OR(";
				condition_ids.forEach((id) => {evidence_formula += `FIND(${id}, Condition),`;});
				evidence_formula = evidence_formula.replace(/,+$/, ")");
			}
		});

		console.log('evidence formula:', evidence_formula);

		db("evidence").select({filterByFormula: evidence_formula}).firstPage(function(error, records) {
			if (records == null || records.length == 0) {
				complete(results);
				return;
			}

		    records.forEach(function(record) {
	    	    results.push({
	    	    	title:   record.get('Study Title'),
					authors: record.get('First Author'),
					journal: record.get('Journal'),
					summary: record.get('Summary')
	    	    });
	    	});

	    	console.log('evidence: ', results.length, results.map((r) => r.title));

	    	complete(results);
	    });
	});

	// TODO
	//   - error handling for empty/null results
	//   - account for results that spill beyond "firstPage" (eg: results > 100)
	//   - expand current assumption that only conditions are being searched
	//   - move away from airtable for simpler querying, lower latency
}

module.exports = router;
