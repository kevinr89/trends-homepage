
const request = require('request')
const keyword_extractor = require("keyword-extractor");
const cheerio = require('cheerio');
const elasticlunr = require('elasticlunr');


const urlGTrends = 'https://trends.google.com/trends/hottrends/visualize/internal/data'


function getResultTrendsNow(urlSitio, filterPath, cb) {
	     
	if (!urlSitio) {
		return cb("Error getResultTrendsNow: url Sitio es requerida");
	}
	
	request(urlGTrends, (error, response, body)=> {
	  if (!error && response.statusCode === 200) {
	    const resp = JSON.parse(body)
	    //console.log("Got a response: ", resp.argentina)

	    execFindHotTrends(urlSitio, filterPath, resp.argentina, cb);
	  } else {
	    return cb("Got an error: " + error + ", status code: " + response.statusCode);
	  }
	})

}




//------------------------------------------------------------------------------------------------------------------------




function execFindHotTrends(url, filterPath, hottrends, cb) {

	//hottrends = ["reeleccion de macri", "nisman", "fardin"];
	//    console.log("request " + url);
	

	request(url, (error, response, body)=> {

		if (error || !response) {
			return cb("Got an error: " + error + ", response: " + !!response);
		}

		if (response.statusCode !== 200) {
			return cb("Got an statusCode no 200: " + response.statusCode);
		}

	   // console.log("ready body");

	    var $ = cheerio.load(body);



		var index = elasticlunr(function () {
		    this.addField('link');
		    this.saveDocument(false);
		});


		var links = $('a');
		var lastLink = null;

		var linksArr = [];

		for(var i=0; i < links.length; i++) {
			if (!links[i])
				continue;
		   var href = $(links[i]).attr('href');
		   if (lastLink && href && lastLink === href) 
		   	continue;
		   lastLink = href;
		   if (href) {
				if(!filterPath || (filterPath && href.indexOf(filterPath) == 0) ) {
		   			linksArr[i] = href;
					index.addDoc({'link':href, "id": i});
				}
		   }
		};



		var resultados = [];
		
		var max_value = 1;

		for(var i=0; i < hottrends.length; i++) {

			var hottrend = hottrends[i];

			//  Extract the keywords
			var clavesArray = keyword_extractor.extract(hottrend,{
			                                                                language:"spanish",
			                                                                remove_digits: true,
			                                                                return_changed_case:true,
			                                                                remove_duplicates: false

			                                                           });

			var claves = clavesArray.join(" ");




			var r = index.search(claves, { 
			    fields : { 
			        link : {boost :  1, expand : false } 
			    }, 
			    bool :  "OR" 
			});

			var resultTrend = {'trend':hottrend, 'posicion': null, 'claves': claves, 'score':0, 'porcentaje' : 0};
			
			resultTrend.posicion = i + 1;
			if (r && r.length > 0 && r[0].score) {

				resultTrend.score = r[0].score;
				if (resultTrend.score > max_value) {
					max_value = resultTrend.score;
				}
				var indiceR = parseInt(r[0].ref);	
				resultTrend.nota = linksArr[indiceR];
			}
			resultados.push(resultTrend);
		}


		if (r && r.length > 0 && r[0].score) {
			
		}

		for(var i=0; i < resultados.length; i++) {
			if (resultados[i].score) {
				resultados[i].porcentaje = Math.round(resultados[i].score * 100);
				if (resultados[i].porcentaje > 100)
					resultados[i].porcentaje = 100;
			}
		}

		return cb(null, resultados);
	})

}

function printConsole(resultados){
	if (!resultados || resultados.length == 0) {
		console.log("No hay resultados");
		return;
	}

	console.log("--------Print Console:");
	var totalOk = 0;
	var totalEval = 0;
	for(i=0; i < resultados.length; i++) {
		console.log("Key: " + resultados[i].posicion + " - " + resultados[i].porcentaje + "% :"  + resultados[i].trend + " : " + resultados[i].score + " " + ((resultados[i].nota)? resultados[i].nota : ''));
		if(resultados[i].porcentaje > 50) {
			totalOk++;
		}else if (resultados[i].porcentaje > 0) {
			totalEval++;
		}
	}

	console.log("-------End: totalOk: " + totalOk + "/" + totalEval + "/" + resultados.length);

}


module.exports.getResultTrendsNow = getResultTrendsNow;  
module.exports.printConsole = printConsole;  


