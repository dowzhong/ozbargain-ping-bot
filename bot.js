require('dotenv').config();

const PREFIX = 'o!';

const RssFeedEmitter = require('rss-feed-emitter');
const feeder = new RssFeedEmitter();

const Discord = require('discord.js');
const client = new Discord.Client();

const database = require('./database/database.js');

client.on('error', err => console.error(err.message));

client.on('ready', async () => {
    console.log('Ready!');
    console.log(await client.generateInvite());
    init();
});

client.on('message', async message => {
    if (!message.content.startsWith(PREFIX) || message.author.bot || !message.guild) { return; }
    const args = message.content.split(' ');
    const command = args.shift().toLowerCase().slice(PREFIX.length);

    if (command === 'watch') {
        const itemToWatch = args.join(' ');
        const itemsUsers = await database.watchItem(itemToWatch, message.member.id);
        if (!itemsUsers) {
            message.reply(`Already watching **${itemToWatch}** for you.`);
            return;
        }

        feeder.add({
            url: `https://www.ozbargain.com.au/product/${itemToWatch.replace(/ +/g, '-')}/feed`,
            refresh: 2000
        });
        message.reply(`Watching **${itemToWatch}** for you.`);
    }

    if (command === 'watching') {
        const user = await database.Users.findOne({
            where: {
                id: message.member.id
            }
        });
        if (!user) {
            message.reply('You\'re not watching any items right now!');
            return;
        }
        const items = await user.getItems();
        if (items.length) {
            message.reply(`You are currently watching: \n${items.map(item => item.name).join('\n')}`)
        } else {
            message.reply(`You are not watching anything.`)
        }
    }

    if (command === 'unwatch') {
        const itemToRemove = args.join(' ');
        const destroyed = await database.ItemsUsers.destroy({
            where: {
                userId: message.member.id,
                itemName: itemToRemove
            }
        });
        if (destroyed) {
            message.reply(`Unwatching **${itemToRemove}** for you.`);
        } else {
            message.reply(`You weren't watching **${itemToRemove}**.`);
        }
    }
});

function init() {
    database.Items.findAll().then(items => {
        items.map(item => item.name).forEach(item => {
            feeder.add({
                url: `https://www.ozbargain.com.au/product/${item.replace(/ +/g, '-')}/feed`,
                refresh: 2000
            });
        });
    });

    feeder.on('new-item', async item => {
        try {
            if (new Date(item['ozb:meta']['@'].expiry) < new Date()) { return; }
            await database.Readlinks.create({
                link: item.link
            });
            const itemName = item.meta.link.match(/https:\/\/www.ozbargain.com.au\/product\/(.+)\/feed/)[1].replace(/-/g, ' ');
            const watchedItem = await database.Items.findOne({
                where: {
                    name: itemName
                }
            });
            if (watchedItem) {
                const watchers = (await watchedItem.getUsers()).map(watcher => watcher.id);
                if (!watchers.length) {
                    database.Items.destroy({
                        where: {
                            name: itemName
                        }
                    }).catch(err => { });
                    return;
                }
                const embed = new Discord.RichEmbed()
                    .setTitle(item.title)
                    .setURL(item.link)
                    .setColor(0xdf8d3d);
                client.channels.find(channel => channel.name === 'ozbargain-bot').send(`${watchers.map(watcher => `<@${watcher}>`).join('')}`, { embed });
            }
        } catch (err) {
            return;
        }
    });
}

client.login(process.env.TOKEN);