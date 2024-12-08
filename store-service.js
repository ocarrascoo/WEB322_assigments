/********************************************************************************* 

WEB322 – Assignment 05 
I declare that this assignment is my own work in accordance with Seneca
Academic Policy.  No part of this assignment has been copied manually or 
electronically from any other source (including 3rd party web sites) or 
distributed to other students. I acknoledge that violation of this policy
to any degree results in a ZERO for this assignment and possible failure of
the course. 

Name:   Omar Carrasco   
Student ID:   156333221
Date:  07/12/2024
Cyclic Web App URL: NOT WORKING  
GitHub Repository URL:  https://github.com/ocarrascoo/WEB322_assigments

********************************************************************************/
const Sequelize = require('sequelize');
const sequelize = new Sequelize('SenecaDb', 'SenecaDb_owner', '9sUbdNa7PwLY', {
    host: 'ep-gentle-butterfly-a5eqy73c.us-east-2.aws.neon.tech',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

// Define the Item model
const Item = sequelize.define('Item', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    category: Sequelize.INTEGER, // Foreign key linking to the Category model
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    price: Sequelize.FLOAT,
    title: Sequelize.STRING,
    body: Sequelize.TEXT,
    published: Sequelize.BOOLEAN
});

// Define the Category model
const Category = sequelize.define('Category', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    category: Sequelize.STRING
});

// Define the relationship between Item and Category
Item.belongsTo(Category, { foreignKey: 'category', onDelete: 'SET NULL' });

module.exports.initialize = function () {
    return new Promise((resolve, reject) => {
        sequelize.sync()
            .then(() => resolve('Database synced successfully'))
            .catch(() => reject('Unable to sync the database'));
    });
};

module.exports.getAllItems = function () {
    return new Promise((resolve, reject) => {
        Item.findAll()
            .then(data => resolve(data))
            .catch(() => reject('No results returned'));
    });
};

module.exports.getItemsByCategory = function (category) {
    return new Promise((resolve, reject) => {
        Item.findAll({ where: { category } })
            .then(data => resolve(data))
            .catch(() => reject('No results returned'));
    });
};

module.exports.getItemsByMinDate = function (minDateStr) {
    return new Promise((resolve, reject) => {
        const { gte } = Sequelize.Op;
        Item.findAll({
            where: {
                postDate: { [gte]: new Date(minDateStr) }
            }
        })
            .then(data => resolve(data))
            .catch(() => reject('No results returned'));
    });
};

module.exports.getItemById = function (id) {
    return new Promise((resolve, reject) => {
        Item.findAll({ where: { id } })
            .then(data => resolve(data[0]))
            .catch(() => reject('No results returned'));
    });
};

module.exports.addItem = function (itemData) {
    return new Promise((resolve, reject) => {
        itemData.published = itemData.published ? true : false;
        for (let prop in itemData) {
            if (itemData[prop] === '') itemData[prop] = null;
        }
        itemData.postDate = new Date();

        Item.create(itemData)
            .then(() => resolve('Item created successfully'))
            .catch(err => {
                console.error('Error creating item:', err); // Log the full error for debugging
                reject(err); // Pass the actual error object
            });
    });
};

module.exports.getPublishedItems = function () {
    return new Promise((resolve, reject) => {
        Item.findAll({ where: { published: true } })
            .then(data => resolve(data))
            .catch(() => reject('No results returned'));
    });
};

module.exports.getPublishedItemsByCategory = function (category) {
    return new Promise((resolve, reject) => {
        Item.findAll({ where: { published: true, category } })
            .then(data => resolve(data))
            .catch(() => reject('No results returned'));
    });
};

module.exports.getCategories = function () {
    return new Promise((resolve, reject) => {
        Category.findAll()
            .then(data => resolve(data))
            .catch(() => reject('No results returned'));
    });
};



module.exports.addCategory = function (categoryData) {
    return new Promise((resolve, reject) => {
        // Replace empty strings with null
        for (let prop in categoryData) {
            if (categoryData[prop] === '') categoryData[prop] = null;
        }

        // Create a new category
        Category.create(categoryData)
            .then(() => resolve('Category created successfully'))
            .catch(() => reject('Unable to create category'));
    });
};

module.exports.deleteCategoryById = function (id) {
    return new Promise((resolve, reject) => {
        // Delete category by ID
        Category.destroy({ where: { id } })
            .then((rowsDeleted) => {
                if (rowsDeleted > 0) resolve('Category deleted successfully');
                else reject('Category not found');
            })
            .catch(() => reject('Unable to delete category'));
    });
};

module.exports.deleteItemById = function (id) {
    return new Promise((resolve, reject) => {
        Item.destroy({ where: { id } })
            .then((deletedCount) => {
                if (deletedCount > 0) {
                    resolve();
                } else {
                    reject("Item not found");
                }
            })
            .catch(() => reject("Error deleting item"));
    });
};
