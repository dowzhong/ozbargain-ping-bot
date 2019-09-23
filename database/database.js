require('dotenv').config();

const Sequelize = require('sequelize');
const sequelize = new Sequelize('database', process.env.DBUSER, process.env.DBPASS, {
    host: 'localhost',
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
});

const Items = sequelize.import('../models/Items.js');
const Users = sequelize.import('../models/Users.js');
const ItemsUsers = sequelize.import('../models/ItemsUsers.js');
const Readlinks = sequelize.import('../models/Readlinks.js');

Items.belongsToMany(Users, { through: ItemsUsers });
Users.belongsToMany(Items, { through: ItemsUsers });

async function watchItem(name, memberId) {
    const [[item], [user]] = await Promise.all([
        Items.findCreateFind({
            where: {
                name
            }
        }),
        Users.findCreateFind({
            where: {
                id: memberId
            }
        })
    ]);
    return await item.addUser(user);
}

module.exports = { sequelize, Items, Users, ItemsUsers, Readlinks, watchItem };