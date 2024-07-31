const mongoose = require('mongoose')

const stockSchema = new mongoose.Schema({
    date: {type: String},
    products:[
        {
            productName: {type: String},
            closingStock: {type: Number},
            sold: {type: Number},
            purchase: {type: Number},
            damaged: {type: Number},
            price: {type: Number},
            Total: {type: Number}
        }
    ],
    closingStockvalue: {type: Number},
    TotalDamagesvalue: {type: Number},
    TotalSoldvalue: {type: Number}
},{
    timestamps: true
})

const StockRecord = mongoose.model('StockRecord', stockSchema)
module.exports = StockRecord