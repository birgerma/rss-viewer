// grab the packages we need
var express = require('express');
const connectLivereload = require("connect-livereload");


const livereload = require("livereload");
const liveReloadServer = livereload.createServer();
// liveReloadServer.watch(path.join(__dirname, 'public'));
liveReloadServer.watch(".");

liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 100);
});

var app = express();
app.use(connectLivereload());

var port = process.env.PORT || 3000;

// routes will go here
app.get('/', function(req, res) {
    res.send("Hello world!");
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
let parser = new Parser();
async function getRssFeed(url){
    let feed = await parser.parseURL(url);
    console.log(feed.title);
     feed.items.forEach(item => {
	 console.log(item.title + ':' + item.link)
     });
}

function main(){
    const RSS_URL = 'https://www.dn.se/rss/';
    // getRssData(RSS_URL, function(data){
    // 	console.log("Retrieved data");
    // });
    getRssFeed(RSS_URL);
}

main();
