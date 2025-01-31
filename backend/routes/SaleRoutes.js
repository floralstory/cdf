import expressAsyncHandler from 'express-async-handler';
import { Transaction, Product } from '../models/Product.js';
import express from 'express';
import { Sale } from '../models/Transactions.js';




const SaleRouter = express.Router()

SaleRouter.get(
  '/sales-data',
  async(req, res)=> {
      const salesData = await Sale.aggregate([
          {
            $group: {
              _id: {
                year: { $year: { $dateFromString: { dateString: '$date' } } },
                month: { $month: { $dateFromString: { dateString: '$date' } } },
                day: { $dayOfMonth: { $dateFromString: { dateString: '$date' } } }
              },
              dailySales: { $push: '$$ROOT' }
            }
          },
          {
            $group: {
              _id: {
                year: '$_id.year',
                month: '$_id.month'
              },
              monthlySales: { $push: '$$ROOT' },
              monthlySummary: {
                $push: {
                  date: '$_id',
                  totalSales: { $sum: '$dailySales.total' },
                  numSales: { $size: '$dailySales' }
                }
              }
            }
          },
          {
            $group: {
              _id: '$_id.year',
              yearlySales: { $push: '$$ROOT' },
              yearlySummary: {
                $push: {
                  year: '$_id',
                  totalSales: { $sum: '$monthlySummary.totalSales' },
                  numSales: { $sum: '$monthlySummary.numSales' }
                }
              }
            }
          },
          {
            $project: {
              _id: 0,
              period: '$_id',
              dailySales: 1,
              monthlySales: 1,
              yearlySales: 1,
              dailySummary: '$monthlySales.monthlySummary',
              monthlySummary: 1,
              yearlySummary: 1
            }
          }
        ]);
      res.send(salesData)
  }
)

SaleRouter.get(
  '/for',
  expressAsyncHandler(async (req, res) => {
    const { day, month, year } = req.query;
    let dateFilter = {};

    try {
      if (year && month && day) {
        const startDate = new Date(year, month - 1, day); // month is 0-based
        const endDate = new Date(year, month - 1, parseInt(day) + 1);
        dateFilter = { createdAt: { $gte: startDate, $lt: endDate } };
      } else if (year && month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // last day of month
        dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };
      } else if (year) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);
        dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };
      }

      const sales = await Sale.aggregate([
        {
          $match: dateFilter
        },
        {
          $facet: {
            sales: [{ $match: {} }],
            totalCount: [{ $count: "count" }],
            totalValue: [
              {
                $group: {
                  _id: null,
                  total: { $sum: { $ifNull: ["$total", 0] } }
                }
              }
            ],
            focSales: [
              { $match: { free: true } },
              {
                $group: {
                  _id: null,
                  total: { $sum: { $ifNull: ["$total", 0] } }
                }
              }
            ],
            paymentTotals: [
              {
                $group: {
                  _id: "$paidBy",
                  total: { $sum: { $ifNull: ["$total", 0] } }
                }
              },
              {
                $project: {
                  _id: 0,
                  paymentMethod: "$_id",
                  total: 1
                }
              }
            ]
          }
        }
      ]);

      const totalCount = sales[0].totalCount[0]?.count || 0;
      const totalValue = sales[0].totalValue[0]?.total || 0;
      const focSales = sales[0].focSales[0]?.total || 0;
      const paymentTotals = sales[0].paymentTotals || [];

      res.status(200).send({ 
        sales: sales[0].sales, 
        totalCount, 
        totalValue, 
        focSales, 
        paymentTotals 
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({ error: 'Unable to get results' });
    }
  })
);


/* SaleRouter.get(
  '/for',
  expressAsyncHandler(
      async(req, res) => {
          const { day, month, year } = req.query;
          let dateRegex;
          
          try {
            if (year && month && day) {
              dateRegex = `^${year}/${month}/${day}`; 
            } else if (year && month) {
              dateRegex = `^${year}/${month}`; 
            } else if (year) {
              dateRegex = `^${year}`; 
            }
          } catch (error) {
            console.log(error);
          }
        
          try {
            const sales = await Sale.aggregate([
              {
                $match: {
                  date: { $regex: dateRegex }
                }
              },
              {
                $facet: {
                  sales: [{ $match: {} }],
                  totalCount: [{ $count: "count" }],
                  totalValue: [
                    {
                      $group: {
                        _id: null,
                        total: { $sum: { $ifNull: ["$total", 0] } }
                      }
                    }
                  ],
                  focSales: [
                    { $match: { free: true } },
                    {
                      $group: {
                        _id: null,
                        total: { $sum: { $ifNull: ["$total", 0] } }
                      }
                    }
                  ],
                  paymentTotals: [
                    {
                      $group: {
                        _id: "$paidBy",
                        total: { $sum: { $ifNull: ["$total", 0] } }
                      }
                    },
                    {
                      $project: {
                        _id: 0,
                        paymentMethod: "$_id",
                        total: 1
                      }
                    }
                  ]
                }
              }
            ]);
            
            const totalCount = sales[0].totalCount[0]?.count || 0;
            const totalValue = sales[0].totalValue[0]?.total || 0;
            const focSales = sales[0].focSales[0]?.total || 0;
            const paymentTotals = sales[0].paymentTotals || [];
        
            // Send the aggregated sales data as the response
            res.status(200).send({ sales: sales[0].sales, totalCount, totalValue, focSales, paymentTotals });
          } catch (error) {
            res.status(500).send({ error: 'Unable to get results' });
          }
        }
  )
) */
SaleRouter.get(
    '/search',
    expressAsyncHandler(
        async(req, res)=> {
            const searchText = req.query.searchText
            const sales = await Sale.aggregate([
              {
                $match:{
                  $or:[
                    {InvoiceCode: {$regex: searchText, $options: 'i' }},
                    {phone: {$regex: searchText, $options: 'i'}}
                  ]
                }
              }
            ])
            res.send(sales)
          }
    )
)
SaleRouter.put(
    '/edit/:id',
    expressAsyncHandler(
        async(req, res)=> {
            try{
              const sale = await Sale.findById(req.params.id)
            if(sale){
              sale.date = req.body.time || sale.date,
              sale.service = req.body.service || sale.service,
              sale.paidBy = req.body.paidBy || sale.paidBy
              await sale.save()
            }
            }catch(error){
              res.send(error)
            }
          }
    )
)
SaleRouter.post(
    '/new-sale',
    expressAsyncHandler(
        async(req, res)=> {
            const ttSales = await Sale.countDocuments()
            const itemsTotal = req.body.products.reduce((total, item)=> {
              return total + (item.quantity * item.price)
            }, 0)
    
            const newSale = new Sale({
                saleItems: req.body.products.map((x)=> ({
                    ...x,
                    quantity: x.quantity,
                    productName: x.name,
                    price: x.price,
                    arrangement: x.arrangement,
                    photo: x.photo
                })),
                preparedBy: req.body.preparedBy,
                itemsTotal: itemsTotal,
                paidBy: req.body.paidBy,
                service: req.body.service,
                date: req.body.time,
                phone: req.body.phone,
                name: req.body.name,
                units:[],
                free: req.body.free,
                discount: req.body.discount,
                deliveredTo: req.body.deliveredTo,
                orderedBy: req.body.orderedBy,
                recievedBy: req.body.recievedBy,
                driver: req.body.driver,
                subTotal: req.body.subTotal,
                total: req.body.total,
                vat: req.body.vat,
                InvoiceCode: `CDFDXB_${ttSales + 1}`,
            })
        
            const sale = await newSale.save()
            res.status(201).send({message: 'sale recorded successfully', sale})
    }
    )
)
SaleRouter.get(
    '/list',
    expressAsyncHandler(
        async(req, res)=> {
            const sales = await Sale.find({}).sort({createdAt: -1})
            //.limit(10)  
            res.send(sales)
        }
    )
)
SaleRouter.get(
    '/today-sales',
    expressAsyncHandler(
        async (req, res) => {
            // Get today's date
            const today = new Date();
            // Set the start of the day (midnight)
            const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            // Set the end of the day (just before midnight)
            const dayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
          
            // Retrieve sales data for today
            const sales = await Sale.find({
              createdAt: {
                $gte: dayStart,
                $lt: dayEnd
              }
            });
          
            res.status(200).send(sales);
          }
    )
)
SaleRouter.get(
    '/get-sale/:id',
    expressAsyncHandler(
        async(req, res)=> {
            const saleId = req.params.id
            const sale = await Sale.findById(saleId)
            if(sale){
                res.send(sale)
            }else{
                res.status(404).send({message: "sale not found"})
            }
        }
    )
)
SaleRouter.post(
    '/:id/add-units',
    expressAsyncHandler(
        async(req, res)=> {
            const saleId = req.params.id
            const {selectedProducts, unitName} = req.body
        
        
            if(!saleId){
                res.status(404).send('no sale found');
                return
            } 
            try{
            
            const sale = await Sale.findById(saleId)
            if (!selectedProducts || selectedProducts.length === 0) {
                return res.status(400).json({ error: 'No products or quantities submitted' });
            }
            if(!sale){
                return res.status(404).json({ error: 'Sale not found' });
            }
            for(const selectedProduct of selectedProducts){
                const product = await Product.findById(selectedProduct.product)
                if(!product){
                    res.status(404).send(`product${selectedProduct.product} not found`)
                    return
                }
                if(product.inStock < selectedProduct.quantity){
                    res.status(400).send('insufficient stock')
                    return
                }
                product.inStock -= selectedProduct.quantity
                product.closingStock -= selectedProduct.quantity
                product.sold += parseInt(selectedProduct.quantity)
                await product.save()
        
                const transaction = new Transaction({
                  product: selectedProduct.product,
                  productName: product.name,
                  purchasePrice: product.purchasePrice,
                  sellingPrice: product.price,
                  type: 'sale',
                  quantity: selectedProduct.quantity
                })
        
                await transaction.save()
            }
            sale.units.push({
                arrangement: unitName,
                products: selectedProducts.map((x)=> ({
                ...x,
                product: x.product,
                productName: x.productName,
                quantity: x.quantity,
            }))})
            
            await sale.save()
        
            res.status(200).send({message: 'data added successfully'})
            }catch(error){
                console.log(error)
                res.status(500).send({message: 'something went wrong'})
        
            }
        }
    )
)



export default SaleRouter