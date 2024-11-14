
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
    const data = await Transaction.aggregate([
      {
        // Extract year and month from the createdAt date field
        $addFields: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" } // Add month field
        }
      },
      {
        // Group by year, month, and type, calculate totals for purchase, sale, and damage
        $group: {
          _id: { year: "$year", month: "$month", type: "$type" },
          totalPurchase: {
            $sum: {
              $cond: [
                { $in: ["$type", ["purchase", "damage"]] }, 
                { $multiply: ["$purchasePrice", "$quantity"] }, // For purchase and damage
                0
              ]
            }
          },
          totalSales: {
            $sum: {
              $cond: [
                { $eq: ["$type", "sale"] },
                { $multiply: ["$sellingPrice", "$quantity"] }, // For sale
                0
              ]
            }
          },
          totalQuantity: { $sum: "$quantity" }
        }
      },
      {
        // Shape the final data output
        $project: {
          year: "$_id.year",
          month: "$_id.month",
          type: "$_id.type",
          totalPurchase: 1,
          totalSales: 1,
          totalQuantity: 1,
          _id: 0
        }
      },
      { $sort: { year: 1, month: 1 } } // Sort by year and month
    ]);

    // Organize the data for each type by year and month
    const aggregatedData = data.reduce((acc, item) => {
      const { year, month, type, totalPurchase, totalSales } = item;

      if (!acc[year]) acc[year] = {}; // Create year if not exists
      if (!acc[year][month]) acc[year][month] = { purchase: 0, damage: 0, sale: 0 }; // Create month if not exists

      // Add totals based on the type
      if (type === 'purchase') {
        acc[year][month].purchase += totalPurchase;
      } else if (type === 'damage') {
        acc[year][month].damage += totalPurchase; // Add to damage if type is 'damage'
      } else if (type === 'sale') {
        acc[year][month].sale += totalSales;
      }

      return acc;
    }, {});

    // Convert the data into a suitable format for charting
    const chartData = Object.keys(aggregatedData).map(year => {
      return Object.keys(aggregatedData[year]).map(month => {
        return {
          year,
          month,
          purchase: aggregatedData[year][month].purchase,
          damage: aggregatedData[year][month].damage,
          sale: aggregatedData[year][month].sale
        };
      });
    }).flat(); // Flatten array for easy processing

    res.status(200).json(chartData); // Return the data
    //console.log(chartData); // Debugging output to check the result
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error in visualizing transactions' });
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