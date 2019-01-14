const mysql = require("mysql");
const inquirer = require("inquirer");
const cTable = require("console.table");

const connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "bamazon_db"
});

const showAllItems = function() {
    connection.query("SELECT * FROM products", function(err, res) {
        if (err) throw err;
        console.log("\n***** CURRENT INVENTORY *****");
        console.table(res);
        console.log("\n**********\n");
        managerPrompt();
    });
};

const viewLowInventory = function() {
    connection.query("SELECT * FROM products WHERE stock_quantity <= 5;", function(err, res) {
        if (err) throw err;
        console.log("\n***** LOW INVENTORY (5 OR FEWER) *****");
        console.table(res);
        console.log("\n**********\n");
        managerPrompt();
    });
};

const addToInventory = function() {
    connection.query("SELECT * FROM products", function(err, res) {
        if (err) throw err;
        console.log("\n***** CURRENT INVENTORY *****");
        console.table(res);
        console.log("\n**********\n");
    });

    inquirer.prompt([
        {
            name: "selectedItem",
            type: "input",
            message: "Type the item ID of the product you would like to replenish: ",
        },
        {
            name: "replenishAmt",
            type: "input",
            message: "How many units would you like to add?",
        }
    ]).then(function(userInput) {
        let updateItem = {
            item_id: 0,
            currentQty: 0,
            replenish: 0,
            stock_quantity: 0
        };
        updateItem.item_id = parseInt(userInput.selectedItem);
        updateItem.replenish = parseInt(userInput.replenishAmt);
        connection.query("SELECT * FROM products WHERE item_id = ?", [userInput.selectedItem], function(err, res) {
            if (err) throw err;
            updateItem.currentQty = res[0].stock_quantity;
            updateItem.stock_quantity = updateItem.currentQty + updateItem.replenish;
            connection.query("UPDATE products SET stock_quantity = ? WHERE item_id = ?", [updateItem.stock_quantity, updateItem.item_id], function(err) {
                if (err) throw err;
                console.log("\nInventory has been updated.\n");
                managerPrompt();
            });
        });
    });
};

const qryAddProduct = function(name, department, priceAmt, stock) {
    let query = "INSERT INTO products SET ?";
    connection.query(query, {product_name: name, department_name: department, price: priceAmt, stock_quantity: stock}, function (err) {
        if (err) throw err;
    });
};

const addNewProduct = function() {
    let newItem = {
        product_name: "",
        department_name: "",
        price: 0,
        stock_quantity: 0,
    };
    inquirer.prompt([
        {
            name: "productName",
            type: "input",
            message: "Name of the product: "
        },
        {
            name: "deptName",
            type: "input",
            message: "Name of department: "
        },
        {
            name: "price",
            type: "input",
            message: "Price of the product: "
        },
        {
            name: "stockQty",
            type: "input",
            message: "Current amount in stock: "
        }
    ]).then(function(userInput) {
        qryAddProduct(userInput.productName, userInput.deptName, userInput.price, userInput.stockQty);
        console.log("\nYour new product has been added\n");
        showAllItems();
    })
};

const managerPrompt = function() {
    inquirer.prompt([
        {
            type: "rawlist",
            message: "MENU",
            choices: ["View Products for Sale", "View Low Inventory", "Add to Inventory", "Add New Product", "Exit"],
            name: "selectedFunction"
        }
    ]).then(function(userInput) {
        switch (userInput.selectedFunction) {
            case "View Products for Sale":
                showAllItems();
                break;
            case "View Low Inventory": 
                viewLowInventory();
                break;
            case "Add to Inventory":
                addToInventory();
                break;
            case "Add New Product":
                addNewProduct();
                break;
            case "Exit":
                connection.end();
                console.clear();
                break;
            default:
                showAllItems();
        };
    });
};

connection.connect(function(err) {
  if (err) throw err;
  console.log(`Welcome to Bamazon!\nConnected as a Manager at id ${connection.threadId}`);
  managerPrompt();
});