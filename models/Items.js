module.exports = (sequelize, datatypes) => {
    return sequelize.define('item', {
        name: {
            type: datatypes.STRING,
            primaryKey: true
        }
    });
}