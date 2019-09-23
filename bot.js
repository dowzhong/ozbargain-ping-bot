const db = require('quick.db');

const RssFeedEmitter = require('rss-feed-emitter');
const feeder = new RssFeedEmitter();

feeder.on('new-item', item => {
    console.log(item);
});