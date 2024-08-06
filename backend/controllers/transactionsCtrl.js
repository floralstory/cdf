
const asyncHandler = require('express-async-handler')
const { Transaction, Product} = require('../models/product');
const Purchase = require('../models/Purchase');
const SaleDetails = require('../models/saleDetails');
const StockRecord = require('../models/StockRecord');




const queryRecords = asyncHandler(async(req, res)=> {
    try {
        const { month, year, productName, type, startDay, endDay } = req.query;
    
        // Build query object based on provided parameters
        const query = {
          ...(month && { createdAt: { $gte: new Date(`${year}-${month}-01`), $lt: new Date(`${year}-${parseInt(month) + 1}-01`) } }),
          ...(productName && { productName }),
          ...(type && { type }),
          ...(startDay && endDay && { createdAt: { $gte: new Date(`${year}-${month}-${startDay}`), $lt: new Date(`${year}-${month}-${endDay}`) } })
        };
    
        const transactions = await Transaction.find(query);
    
        // Calculate total quantity and total price
        let totalQuantity = 0;
        let totalPrice = 0;
        transactions.forEach(transaction => {
          totalQuantity += transaction.quantity;
          totalPrice += transaction.quantity * transaction.purchasePrice;
        });
    
        const responseData = {
          data: transactions,
          totals: {
            totalQuantity,
            totalPrice
          }
        };
    
        res.send(responseData);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
      }
})

const visualizeTransactions = asyncHandler(async (req, res) => {
    try {
        const { startDate, endDate, type } = req.query;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const results = [];

        // Loop through each day within the date range
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);

            let match = {
                createdAt: {
                    $gte: date,
                    $lt: nextDay,
                },
            };

            // If a specific type is passed, add type to the match condition
            if (type) {
                match.type = type;
            }

            const transactions = await Transaction.aggregate([
                {
                    $match: match,
                },
                {
                    $group: {
                        _id: '$type',
                        totalQuantity: { $sum: '$quantity' },
                        totalPrice: { $sum: { $multiply: ['$quantity', '$purchasePrice'] } },
                    },
                },
            ]);

            // Push the aggregated transactions for the day to the results array
            results.push({ date: date.toISOString().split('T')[0], transactions });
        }

        // Extract unique types from transactions
        const typesSet = new Set();
        results.forEach(({ transactions }) => {
            transactions.forEach(({ _id }) => {
                typesSet.add(_id);
            });
        });
        const types = Array.from(typesSet);

        res.json({ results, types });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

const dailyReport = asyncHandler(async(req, res)=> {
    const {date, type, } = req.query
    if(type === 'purchase'){
        try{
            const data = await Purchase.find({
                createdAt: {
                  $gte: new Date(date),
                  $lt: new Date(date + 'T23:59:59.999Z') //full day hours
                }
            });
            res.send(data)
            //console.log(data)
        }catch(error){
            console.log(error)
        }
    }else if(type === 'closing'){
      try{
        let today = new Date().toISOString().split('T')[0]
        let data;
        if(today === date){
          data = await Product.aggregate([
            {
                $match: {
                  $or: [
                    { inStock: { $gt: 0 } },
                    { purchase: { $gt: 0 } },
                    { waste: { $gt: 0 } },
                    { sold: { $gt: 0 } }
                  ]
                }
              },
              {
                $group: {
                  _id: null,
                  products: {
                    $push: {
                      name: "$name",
                      purchase: "$purchase",
                      sold: "$sold",
                      waste: "$waste",
                      closingStock: "$closingStock"
                    }
                  },
                  totalPurchase: { $sum: { $multiply: ["$purchase", "$purchasePrice"] } },
                  totalSold: { $sum: { $multiply: ["$sold", "$purchasePrice"] } },
                  totalWaste: { $sum: { $multiply: ["$waste", "$purchasePrice"] } },
                  totalClosingStock: { $sum: { $multiply: ["$closingStock", "$purchasePrice"] } }
                }
              },
              {
                $project: {
                  _id: 0,
                  products: 1,
                  totalPurchase: 1,
                  totalSold: 1,
                  totalWaste: 1,
                  totalClosingStock: 1
                }
              }
            ]);
        }else{
          const startOfDay = new Date(date);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(date);
          endOfDay.setHours(23, 59, 59, 999);

          data = await StockRecord.findOne({
          createdAt: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        });
        }
        //console.log(data)
        res.send(data)
        }catch(error){
          res.send(error)
        }
          
    }else if(type === 'sales'){
        try{
            const data = await Transaction.find({
                createdAt: {
                    $gte: new Date(date),
                    $lte: new Date(date + 'T23:59:59.999Z')
                },
                type: "sale"
            })
            res.send(data)
        }catch(error){
            console.log(error)
        }
    }else if(type === 'damages'){
        try{
            const data = await Transaction.find({
                createdAt:{
                    $gte: new Date(date),
                    $lte: new Date(date + "T23:59:59.999Z")
                },
                type: 'damage'
            })
            res.send(data)
        }catch(error){
            res.send(error)
        }
    }else if (type === 'invoices'){
        try{
            const data = await SaleDetails.find({
                createdAt: {
                  $gte: new Date(date),
                  $lt: new Date(date + 'T23:59:59.999Z') //full day hours
                }
            });
            res.send(data)
        }catch(error){
            res.send(error)
        }
    }
})

  
module.exports = {queryRecords, visualizeTransactions, dailyReport}