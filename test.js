const mustangtrends = require('./index.js');


mustangtrends.getResultTrendsNow("https://www.infobae.com", null, function(e, resultados){
	if (e) {
		return console.log("Error en getResultTrendsNow: " + e);
	}
	mustangtrends.printConsole(resultados);
});


