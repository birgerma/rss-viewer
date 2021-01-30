// grab the packages we need
var express = require('express');
var cors = require('cors')

var corsOptions = {
  origin: 'http://www.dn.se',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

const connectLivereload = require("connect-livereload");

const nunjucks = require('nunjucks')

// const livereload = require("livereload");
// const liveReloadServer = livereload.createServer();
// liveReloadServer.watch(path.join(__dirname, 'public'));
// liveReloadServer.watch(".");

// liveReloadServer.server.once("connection", () => {
//   setTimeout(() => {
//     liveReloadServer.refresh("/");
//   }, 100);
// });

var app = express();
// app.use(connectLivereload());
app.use(cors());


nunjucks.configure('views', {
    autoescape: true,
    express: app
});

var port = process.env.PORT || 3000;

// routes will go here
app.get('/', function(req, res) {
    res.send("Hello world!");
});

var fs = require('fs'),
    request = require('request');

var download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

// download('https://www.google.com/images/srpr/logo3w.png', 'google.png', function(){
  // console.log('done');
// });

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
    // console.log("Date:", context.date)

    context.author = article['dc:creator']
    // console.log("Author:", context.author)
    
    context.description = article.description
    console.log(article.link)



    context.mediaDescription = undefined
    try {
	mediaContent = article['media:content'][0];
	context.mediaDescription = mediaDescription = article['media:content'][0]['media:description'][0]
    } catch (e){
	console.log("Error:", e)
    }
    // console.log("Media content",mediaContent);
    
    // console.log("Media description:", mediaDescription);
    
    
}

var path = require('path');
var dir = path.join(__dirname, 'public');
app.use(express.static(dir))


app.get('/news', cors(), function(req, res){
    res.render('template.html', context);
});
// start the server
app.listen(port);
console.log('Server started! At http://localhost:' + port);



const https = require('https');

function getRssData(url, callback){
    https.get(url, (resp) => {
	let data = '';

	// A chunk of data has been received.
	resp.on('data', (chunk) => {
	    data += chunk;
	});

	// The whole response has been received. Print out the result.
	resp.on('end', () => {
	    // console.log(JSON.parse(data).explanation);
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

    // let article = feed.items[0];
    // console.log(article);
    // mediaContent = article['media:content']

    // console.log("-----------")
    // console.log(mediaContent[0]['$'].url)
    return feed;
    // console.log(feed.title);
    //  feed.items.forEach(item => {
    // 	 // console.log(item.title + ':' + item.link)
    // 	 console.log()
    //  });
}

function main(){
    const RSS_URL = 'https://www.dn.se/rss/';
    // getRssData(RSS_URL, function(data){
    // 	console.log("Retrieved data");
    // });
    const INTERVAL = 1000*60*5
    getRssFeed(RSS_URL).then(function(data){
	// console.log("Getting data:",data.items[0])
	updateCurrentArticle(data.items[0]);
	index = 1;
	setInterval(function(){
	    // console.log("hi")
	    article = data.items[index];
	    index++;
	    
	    updateCurrentArticle(article)
	},INTERVAL) //logs hi every second
    });
}

main();
