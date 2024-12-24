import expressAsyncHandler from 'express-async-handler'
import express from 'express'
import { Purchase, Sale } from '../models/Transactions.js'
import { Transaction, Product } from '../models/Product.js'



const TransactionRouter = express.Router()


TransactionRouter.post(
    '/purchase',
    expressAsyncHandler(
        async(req, res)=> {
            try{
                const {selectedProducts, deliveryNote, total} = req.body
        
       
                const newPurchase = new Purchase({
                    deliveryNote: deliveryNote,
                    Items: selectedProducts,
                    total: total
                })
        
                await newPurchase.save()
        
                for(const selectedProduct of selectedProducts){
        
                    const newProduct = await Product.findById(selectedProduct.product)
        
                    if (!newProduct) {
                        return res.status(404).json({ error: "Product not found" });
                    }
        
                    newProduct.inStock += parseInt(selectedProduct.quantity);
                    newProduct.closingStock += parseInt(selectedProduct.quantity);
                    newProduct.purchase += parseInt(selectedProduct.quantity)
        
        
                    await newProduct.save()
        
        
                    const transaction = new Transaction({
                        product: selectedProduct.product,
                        purchasePrice: newProduct.purchasePrice,
                        sellingPrice: newProduct.price,
                        productName: newProduct.name,
                        type: 'purchase',
                        deliveryNote: deliveryNote,
                        quantity: parseInt(selectedProduct.quantity)
                    })
        
                    await transaction.save()
                }
                res.status(200).send({ message: "Bulk purchase successful" });
            }catch(error){
                console.log(error)
                res.send(error)
            }
        }
    )
)


///UPDATE PURCHASE DATA
TransactionRouter.put(
    '/:deliveryNote',
    expressAsyncHandler(async(req, res)=> {
        const {purchase, total, type} = req.body
        const {deliveryNote} = req.params
        try{
            const dbPurchase  = await Purchase.findOne({deliveryNote})


        if(!dbPurchase){
            res.status(404).send({message:"Purchase not Found"})
            return
        }
        
        dbPurchase.Items = purchase.Items
        dbPurchase.total = total 

        for(const product of purchase.Items){
        
            const newProduct = await Product.findById(product.product)

            if (!newProduct) {
                return res.status(404).json({ error: "Product not found" });
            }

            const quantityToReturn = parseInt(product.quantity);
                newProduct.inStock -= quantityToReturn;
                newProduct.closingStock -= quantityToReturn;
                newProduct.returned += quantityToReturn;


            await newProduct.save()


            const transaction = new Transaction({
                product: product.product,
                purchasePrice: newProduct.purchasePrice,
                sellingPrice: newProduct.price,
                productName: newProduct.name,
                type: type,
                deliveryNote: deliveryNote,
                quantity: parseInt(product.quantity)
            })

            await transaction.save()
        }
        res.status(200).send({ message: "Bulk Successful" });

        await dbPurchase.save()

        }catch(error){
            res.send(error)
        }
    })
)


TransactionRouter.get(
    '/records',
    expressAsyncHandler(
        async(req, res)=> {
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
        }  
    )
)
TransactionRouter.get(
    '/daily-report',
    expressAsyncHandler(
        async(req, res)=> {
            const {date, type, } = req.query
            if(type === 'purchase'){
                try{
                    const data = await Purchase.find({
                        createdAt: {
                          $gte: new Date(date),
                          $lt: new Date(date + 'T23:59:59.999Z')
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
                    const data = await Sale.find({
                        createdAt: {
                          $gte: new Date(date),
                          $lt: new Date(date + 'T23:59:59.999Z')
                        }
                    });
                    res.send(data)
                }catch(error){
                    res.send(error)
                }
            }
        }
    )
)


const getLast12Months = () => {
    const endDate = new Date(); // Today
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12); // 12 months ago
    return { startDate, endDate };
  };

TransactionRouter.get(
    '/visualize',
    expressAsyncHandler(async (req, res) => {
        try {
          // Get startDate and endDate from query params, or default to the past 12 months
          let { startDate, endDate } = req.query;
    
          // If no dates are provided, use the last 12 months
          if (!startDate || !endDate) {
            const { startDate: defaultStartDate, endDate: defaultEndDate } = getLast12Months();
            startDate = defaultStartDate.toISOString();  // Convert to ISO string
            endDate = defaultEndDate.toISOString();      // Convert to ISO string
          }
    
          // Convert to Date objects (MongoDB expects Date objects for comparisons)
          const start = new Date(startDate);
          const end = new Date(endDate);
    
          // Perform aggregation
          const results = await Transaction.aggregate([
            {
              $match: {
                createdAt: { $gte: start, $lt: end },
              },
            },
            {
              $project: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                quantity: 1,
                type: 1,
                purchasePrice: 1,
                sellingPrice: 1,
              },
            },
            {
              $group: {
                _id: { year: '$year', month: '$month' },
                totalPurchase: {
                  $sum: {
                    $cond: [{ $eq: ['$type', 'purchase'] }, '$quantity', 0],
                  },
                },
                totalSale: {
                  $sum: {
                    $cond: [{ $eq: ['$type', 'sale'] }, '$quantity', 0],
                  },
                },
                totalDamage: {
                  $sum: {
                    $cond: [{ $eq: ['$type', 'damage'] }, '$quantity', 0],
                  },
                },
                totalReturned: {
                  $sum: {
                    $cond: [{ $eq: ['$type', 'returned'] }, '$quantity', 0],
                  },
                },
              },
            },
            {
              $sort: { '_id.year': 1, '_id.month': 1 },
            },
          ]);
    
          // Format the data for the client
          const formattedData = [
            ['Year-Month', 'Purchase', 'Sale', 'Damage', 'Returned'],
            ...results.map(item => {
              const date = `${item._id.year}-${item._id.month < 10 ? '0' + item._id.month : item._id.month}`;
              return [
                date,
                item.totalPurchase,
                item.totalSale,
                item.totalDamage,
                item.totalReturned,
              ];
            }),
          ];
    
          res.json(formattedData);
        } catch (error) {
          console.error('Error fetching data:', error);
          res.status(500).json({ message: 'Server Error' });
        }
      })
    );

TransactionRouter.post(
    '/damages',
    expressAsyncHandler(
        async(req, res)=> {
            try{
                const {selectedProducts, display} = req.body
          
                for(const selectedProduct of selectedProducts){
          
                    const newProduct = await Product.findById(selectedProduct.product)
          
                    //CHECK AVAILABILITY
                    if (!newProduct) {
                        return res.status(404).json({ error: "Product not found" });
                    }
          
                    ///UPDATE STOCK QUANTITIES
                    if(selectedProduct.quantity > newProduct.inStock || selectedProduct.quantity > newProduct.closingStock){
                      res.status(400).send({message: 'Insufficient stock'})
                      return
                    }
                    newProduct.waste += parseInt(selectedProduct.quantity)
                    newProduct.inStock -= parseInt(selectedProduct.quantity);
                    newProduct.closingStock -= parseInt(selectedProduct.quantity);
                    
                    await newProduct.save()
          
                    ///CREATE TRANSACTION
          
                    const transaction = new Transaction({
                        product: selectedProduct.product,
                        productName: newProduct.name,
                        purchasePrice: newProduct.purchasePrice,
                        type: display ? 'display' : 'damage',
                        quantity: parseInt(selectedProduct.quantity)
                    })
          
                    await transaction.save()
                }
                res.status(200).send({ message: "Bulk record succeded"});
            }catch(error){
                console.log(error)
                res.send(error)
            }
        }
    )
)

TransactionRouter.get(
    '/:deliveryNote',
    expressAsyncHandler(async(req, res)=> {
        try{
            const dbPurchase  = await Purchase.findOne({deliveryNote: req.params.deliveryNote})

        if(!dbPurchase){
            res.status(404).send({message:"Purchase not Found"})
            return
        }
        res.status(200).send(dbPurchase)

        }catch(error){
            res.send(error)
        }
    })
)


export default TransactionRouter

