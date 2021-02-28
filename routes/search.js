var express = require('express');
var router = express.Router();
var url = require('url');

/* GET search results */
router.get('/', function(req, res, next) {
	console.log(req.query);
    res.render('search', { 
    	title: 'CannaClarified',
    	q: req.query.q,
    	results: db_search(req.query.q)
    });
});

function db_search(q) {
	var title   = "Isolation of Aspergillus caninus (Synonym: Phialosimplex caninus) from a Canine Iliac Lymph node.";
	var authors = "Kano R, Sakai M, Hiyama M, Tani K.";
	var journal = "Mycopathologia. 2019 Apr;184(2):335-339. doi: 10.1007/s11046-018-0312-3. Epub 2019 Jan 31.";
	var summary = "Aspergillus caninus (synonym: Phialosimplex caninus) is an anamorphic fungus species associated with systemic infections in dogs that has been transferred from the genus Phialosimplex to Aspergillus. ...Since the response of the patient dog to ITZ and VRZ treatments …";

	var results = [
		{
			title: title,
			authors: authors,
			journal: journal,
			summary: summary
		}, {
			title: title,
			authors: authors,
			journal: journal,
			summary: summary
		}, {
			title: title,
			authors: authors,
			journal: journal,
			summary: summary
		}, {
			title: title,
			authors: authors,
			journal: journal,
			summary: summary
		}, {
			title: title,
			authors: authors,
			journal: journal,
			summary: summary
		}
	]

	return results;
}

module.exports = router;
