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

const purchaseItem = {
    id: 0,
    productName: "",
    price: 0,
    qty: 0,
    total: function() {return this.price * this.qty},
    inStock: true,
    numInStock: 0
};

const updateInventory = function(itemID, qty) {
    let newInventory = purchaseItem.numInStock - qty;
    connection.query(`UPDATE products SET stock_quantity = ? WHERE item_id = ?;`, [newInventory, itemID], function (err, res) {
        var values = [[purchaseItem.productName, purchaseItem.qty, `$${purchaseItem.price}`, `$${purchaseItem.total()}`]];
        console.table(["Item", "Qty", "Price", "Total"], values);
        console.log("\nYour order is now complete! Thank you for your business!\n");
        connection.end();
    });
};

const checkInventory = function(itemID, qty) {
    connection.query(`SELECT * FROM products WHERE item_id = ?;`, [itemID], function(err, res) {
        if (err) throw err;
        if (qty > res[0].stock_quantity) {
            purchaseItem.inStock = false;
            console.log("\nYour quantity exceeds our inventory. Please try your order again.\n");
            customerPrompt();
        } else {
            purchaseItem.inStock = true;
            purchaseItem.productName = res[0].product_name;
            purchaseItem.price = res[0].price;
            purchaseItem.numInStock = res[0].stock_quantity;
            console.log("\nProcessing your order...\n");
            updateInventory(itemID, qty);
        };
    });
};

const customerPrompt = function() {
    inquirer.prompt([
        {
            type: "input",
            message: "Type in the item ID you would like to purchase: ",
            name: "selectedID"
        },
        {
            type: "input",
            message: "Type in the quantity you would like to purchase: ",
            name: "selectedQty"
        }
    ]).then(function(userInput) {
        purchaseItem.id = userInput.selectedID;
        purchaseItem.qty = userInput.selectedQty;
        checkInventory(purchaseItem.id, purchaseItem.qty);
    });
};

const showAllItems = function() {
    connection.query("SELECT * FROM products", function(err, res) {
        if (err) throw err;
        console.log("\n***** CURRENT INVENTORY *****");
        console.table(res);
        console.log("\n**********\n");
        customerPrompt();
    });
};

connection.connect(function(err) {
  if (err) throw err;
  console.log(`Welcome to Bamazon!\nConnected as id ${connection.threadId}`);
  showAllItems();
});