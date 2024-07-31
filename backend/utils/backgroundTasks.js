const cronJob = require('node-cron')
const {Product} = require('../models/product')
const StockRecord = require('../models/StockRecord')


Product.schema.virtual("nextWasteResetTime").get(function () {
    const resetTime = new Date(this.updatedAt || this.createdAt).getTime() + 24 * 60 * 60 * 1000;
    return resetTime;
  });

const getstockSnapShot = async () => {
    try {
      const [products] = await Product.aggregate([
        {
          $match: {
            $or: [
              { sold: { $gt: 0 }},
              { inStock: { $gt: 0 }},
              { waste: { $gt: 0 }},
              { purchase: { $gt: 0 }},
            ]
          },
        },
        {
          $group:{
            _id: null,
            products:{
              $push:{
                name: "$name",
                purchase: "$purchase",
                sold: "$sold",
                waste:"$waste",
                inStock:"$inStock"
              }
            },

            totalPurchase: {$sum: {$multiply: ["$purchase", "$purchasePrice"]}},
            totalSold: {$sum: {$multiply: ["$sold", "$purchasePrice"]}},
            totalWaste: {$sum: {$multiply: ["$waste", "$purchasePrice"]}},
            totalClosingStock: {$sum: {$multiply: ["$inStock", "$purchasePrice"]}},
          }
        },
        {
          $project:{
            _id: 0,
            products: 1,
            totalPurchase: 1,
            totalSold: 1,
            totalWaste: 1,
            totalClosingStock: 1 
          }
        }
      ]);
  
      if (!products) {
        console.error('No products found for the snapshot.');
        return;
      }
      
      // Create a single stock record for the entire collection with individual product details
      const stockRecord = new StockRecord({
        date: new Date().toISOString(),
        products: products.products,
        closingStockvalue: products.totalClosingStock,
        TotalDamagesvalue: products.totalWaste,
        totalPurchase: products.totalPurchase,
        TotalSoldvalue: products.totalSold,
      });
  
      // Save the stock record to the database
      await stockRecord.save();  
    } catch (error) {
      console.error('Error recording stock snapshot:', error.message);
    }
  };

const resetWasteValues = async()=> {
    try{
        const productsToUpdate = await Product.find({waste: { $exists: true}, sold: {$exists: true}})

        for(const product of productsToUpdate){
            product.waste = 0;
            product.purchase = 0;
            product.sold = 0
            await product.save()
        }
    }catch(error){
        console.log(error, 'failed to reset waste values')
    }
  }
  

  const backgroundTasks={
    start: ()=> {
      cronJob.schedule('0 0 * * * ', getstockSnapShot);
      cronJob.schedule('10 0 * * * ', resetWasteValues)
    }
  }

module.exports = backgroundTasks