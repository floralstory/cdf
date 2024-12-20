import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import path from 'path';
import userRouter from './routes/userRouter.js';
import ProductRouter from './routes/ProductRoutes.js';
import backgroundTasks from './utils/backgroundTasks.js';
import TransactionRouter from './routes/transactionRoutes.js';
import { ErrorHandler, UploadRouter } from './Helpers.js';
import { fileURLToPath } from 'url';
import SaleRouter from './routes/SaleRoutes.js';

const app = express();
dotenv.config()
backgroundTasks.start()
const PORT = process.env.PORT



//middleware
app.use(express.json());
app.use(cookieParser())
app.use(express.urlencoded({extended: false}))
app.use('/uploads', express.static('uploads'));
app.use(bodyParser.json())


//routes middleware
app.use('/api/product', ProductRouter)
app.use('/api/user', userRouter)
app.use('/api/sale', SaleRouter)
app.use('/api/upload', UploadRouter)
app.use('/api/transactions', TransactionRouter)

//errorMiddleware
app.use(ErrorHandler)


const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/build')));

    // Serve the React app
    app.get('*', (req, res) => 
        res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'))
    );
} else {
    app.get('/', (req, res) => res.send('Please set to production mode'));
}

mongoose.connect(process.env.MONGO_URI)
.then(()=> {

        app.listen(process.env.PORT, ()=> {
            console.log(`app running on ${PORT}`)
        })
    
}).catch((err)=> console.log(err))

