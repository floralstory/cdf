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
    closingStockvalue: {type: Number, default: 0},
    totalPurchase: {type: Number}, default: 0,
    TotalDamagesvalue: {type: Number, default: 0},
    TotalSoldvalue: {type: Number, default: 0}
},{
    timestamps: true
})

const StockRecord = mongoose.model('StockRecord', stockSchema)
module.exports = StockRecord