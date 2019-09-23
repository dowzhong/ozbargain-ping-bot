module.exports = (sequelize, datatypes) => {
    return sequelize.define('user', {
        id: {
            type: datatypes.STRING,
            primaryKey: true
        }
    });
}