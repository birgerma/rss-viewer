// grab the packages we need
const https = require('https');
var express = require('express');
const connectLivereload = require("connect-livereload");
const nunjucks = require('nunjucks')
var fs = require('fs');
var request = require('request');

var app = express();


nunjucks.configure('views', {
    autoescape: true,
    express: app
});


var download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

context = {}
function updateCurrentArticle(article){
    try{
	imageUrl = article['media:content'][0]['$'].url
    } catch(e){
	imageUrl = false;
    }
    if(imageUrl){
	download(imageUrl, 'public/img.png', function(){
	    console.log("Done downloading");
	    context.image = '/img.png'
	});
    }else{
	    context.image = undefined
    }
    context.title = article.title;
    context.date = article.pubDate;

    context.author = article['dc:creator']
    
    context.description = article.description
    console.log(article.link)

    context.mediaDescription = undefined
    try {
	mediaContent = article['media:content'][0];
	context.mediaDescription = mediaDescription = article['media:content'][0]['media:description'][0]
    } catch (e){
	console.log("Error:", e)
    }
}

var path = require('path');
var dir = path.join(__dirname, 'public');
app.use(express.static(dir))

app.get('/', function(req, res){
    res.render('template.html', context);
});

function getRssData(url, callback){
    https.get(url, (resp) => {
	let data = '';
	// A chunk of data has been received.
	resp.on('data', (chunk) => {
	    data += chunk;
	});

	resp.on('end', () => {
	    callback(data);
	});

    }).on("error", (err) => {
	console.log("Error: " + err.message);
    });
}

let Parser = require('rss-parser');
let parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media:content', {keepArray: true}],
    ]
  }
});

async function getRssFeed(url){
    let feed = await parser.parseURL(url);

    return feed;
}

async function main(){
    var port = process.env.PORT || 3000;
    const RSS_URL = 'https://www.dn.se/rss/';
    const RSS_UPDATE_INTERVAL = 1000*60*60 // Every hour
    const INTERVAL = 1000*60*5 // Every 5 min

    // start the server
    app.listen(port);
    console.log('Server started! At http://localhost:' + port);

    data = await getRssFeed(RSS_URL);
    updateCurrentArticle(data.items[0]);
    index = 1;
    setInterval(function(){
	setInterval(function(){
	    article = data.items[index];
	    index++;
	    updateCurrentArticle(article)
	},INTERVAL);
    },RSS_UPDATE_INTERVAL);
}

main();
