var needle = require('needle');
var cheerio = require("cheerio");
var fs = require("fs");

var jsonArray = []; // object result array

var apiURL = "https://www.google.com/finance/historical";

var time = 0;

function trimLast(str) {
	return str.substring(0, str.length-1);
}

function pullToJson(param, done) {

	needle.request('get', apiURL, param, function(error, response) {

		param.start = param.start + param.num;

	    var html = response.body;
	    $ = cheerio.load(html);
	    var rows = $(".gf-table tr");
	    for(var i = 0, rowsLen = rows.length; i < rowsLen; i = i + 1) {
	    	var row = $(rows[i]);

	    	// skip header
	    	if(row.hasClass("bb")) continue;

	    	var cols = row.find("td");
	    	var jsonObject = {};
	    	jsonObject.date = trimLast($(cols[0]).html());
	    	jsonObject.open = trimLast($(cols[1]).html());
	    	jsonObject.high = trimLast($(cols[2]).html());
	    	jsonObject.low = trimLast($(cols[3]).html());
	    	jsonObject.close = trimLast($(cols[4]).html());
	    	jsonObject.volume = trimLast($(cols[5]).html());
	    	jsonArray.push(jsonObject);
	    }

	}).on('end', function() {
	    time = time + 1;
		if(time == 2) {
			done();
		}
	});
}

for(var i = 0; i < 2; i++) {
	var param = {};
	param.cid = "674482";
	param.startdate = "Apr 13, 2014";
	param.enddate = "Apr 12, 2015";
	param.num = 200;
	param.start = i * 200;

	pullToJson(param, function() {
		console.log("done");
		fs.writeFileSync("result.json", JSON.stringify(jsonArray));
	});
}