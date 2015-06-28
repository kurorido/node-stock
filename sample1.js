var needle = require('needle');
var cheerio = require("cheerio");
var fs = require("fs");
var mongoose = require('mongoose');
var moment = require('moment');
var jsonArray = []; // object result array

var apiURL = "https://www.google.com/finance/historical";

var Schema = mongoose.Schema;

var stockSchema = new Schema({
  open:  Number,
  high: Number,
  low:  Number,
  close: Number,
  volume: Number,
  date: { type: Date }
});

function trimLast(str) {
	return str.substring(0, str.length-1);
}

mongoose.connect('mongodb://localhost/stock');
mongoose.connection.on('error', console.log);

var collection = "TPE:2387";
var Stock = mongoose.model("TPE2387", stockSchema);

function pullToJson(param, done) {

	var url = apiURL + "?q=" + param.q + "&startdate=" + param.startdate + "&enddate=" + param.enddate + "&num=" + param.num + "&start=" + param.start;
	url = encodeURI(url);

	needle.get(url, function(error, response) {

		if(!error) {
		    var html = response.body;
		    $ = cheerio.load(html);
		    var rows = $(".gf-table tr");
		    console.log(rows.length)
		    for(var i = 0, rowsLen = rows.length; i < rowsLen; i = i + 1) {
		    	var row = $(rows[i]);

		    	// skip header
		    	if(row.hasClass("bb")) {
		    		console.log("header skip"); 
		    		continue;
		    	}

		    	var cols = row.find("td");
		    	var stock = new Stock();
		    	stock.date = moment(trimLast($(cols[0]).html())).toDate();
		    	stock.open = trimLast($(cols[1]).html()).replace(/,/g, '');
		    	stock.high = trimLast($(cols[2]).html()).replace(/,/g, '');
		    	stock.low = trimLast($(cols[3]).html()).replace(/,/g, '');
		    	stock.close = trimLast($(cols[4]).html()).replace(/,/g, '');
		    	stock.volume = trimLast($(cols[5]).html()).replace(/,/g, '');
		    	stock.save(function(err) {
		    		if(err) console.log(err);
		    	});
		    }
		} else {
			console.log(error);
		}


	});
}

for(var i = 0; i < 2; i++) {
	var param = {};
	param.q = collection;
	param.startdate = "Apr 13, 2014";
	param.enddate = "Apr 12, 2015";
	param.num = 200;
	param.start = i * 200;

	pullToJson(param, function() {
		console.log("done");
		fs.writeFileSync("result.json", JSON.stringify(jsonArray, null, '\t'));
	});
}