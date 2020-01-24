const mustangtrends = require('./index.js');


mustangtrends.getResultTrendsNow("https://www.infobae.com", null, function(error, resultados){
	if (error) {
		return console.log("Error en getResultTrendsNow: " + error);
	}

	mustangtrends.printConsole(resultados);
});