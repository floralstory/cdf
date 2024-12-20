import React, {useContext, useEffect, useState} from 'react'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import axios from 'axios'
import { getError } from '../utils/getError'
import { toast } from 'react-toastify'
import Table from 'react-bootstrap/esm/Table'
import Form from 'react-bootstrap/esm/Form'
import Button from 'react-bootstrap/esm/Button'
import { FaEye } from 'react-icons/fa'
import SaleDetailsModal from './SaleDetailsModal'
import { BsPaperclip, BsXCircle } from 'react-icons/bs'
import { Store } from '../utils/Store'
import MessageBox from './MessageBox'




export default function SaleHistory() {

    const {state} = useContext(Store)
    const {todaySales} = state

    const [selectedSale, setSelectedSale] = useState({})
    const [showModal, setShowModal] = useState(false)
    const [data, setData] = useState([])
    const [searchText, setSearchText] = useState('')
    
    
    const addSale = async(saleId)=>{
        const {data} = await axios.get(`/api/sale/get-sale/${saleId}`)
        localStorage.setItem('selectedSale', JSON.stringify(data))
        //ctxDispatch({type: "ADD_SELECTED_SALE", payload: data})
        toast.success('sale attched successfully')
    }
  
   
    const handleViewSale = async (saleId)=> {
       try{
        const result = await axios.get(`/api/sale/get-sale/${saleId}`)
        setSelectedSale(result.data)
        setShowModal(true)
       } catch(error){
        toast.error(getError(error))
       }
    }

    const handleSearch = async()=>{
        const {data} = await axios.get(`/api/sale/search?searchText=${searchText}`)
        setData(data) 
    }

    useEffect(()=> {
        handleSearch()

    }, [todaySales, searchText, selectedSale])


  return (

        <Row className='p-2'>
            <h2 className='text-success'>{todaySales.length} Sales Today </h2>
            <Form.Label>PHONE / INVOICE CODE</Form.Label>
            <Form.Group className='d-flex'>
                <Form.Control type='text'
                    value={searchText}
                    onChange={(e)=> setSearchText(e.target.value)}
                    placeholder='invoice code / phone number'
                />
                <span>
                <Button variant='' onClick={()=> setSearchText('')}>
                <BsXCircle/>
                </Button>
                </span>
            </Form.Group>
            {searchText === '' ? (
                <Col>
                {todaySales && todaySales ? (
                    <Table style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Date</th>
                            <th>Total</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {todaySales && todaySales.map((sale)=> (
                            <tr key={sale._id}>
                                <td>  
                                    <Button onClick={()=>handleViewSale(sale._id)} className='bg-primary border'>
                                    <span className='px-1'>
                                        <FaEye/>
                                    </span>
                                    {sale.InvoiceCode}
                                    </Button>
                                </td>
                                <td>{sale.date}</td>
                                <td>{sale.total}</td>
                                <td className='d-flex'>
                                    <Col >
                                        <Button variant='warning' onClick={()=> addSale(sale._id)}>
                                        <BsPaperclip/>
                                        </Button>
                                    </Col>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
                ) : (
                    <MessageBox>NO SALES TODAY</MessageBox>
                )}
    
                </Col>
            ): (
                <Col>
                {data.length > 0 ? (
                    <Table style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        <thead>
                        <tr>
                            <th>Code</th>
                            <th>Date</th>
                            <th>Total</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data && data.map((sale)=> (
                            <tr key={sale._id}>
                                <td>  
                                    <Button onClick={()=>handleViewSale(sale._id)} className='bg-primary border'>
                                    <span className='px-1'>
                                        <FaEye/>
                                    </span>
                                    {sale.InvoiceCode}
                                    </Button>
                                </td>
                                <td>{sale.date}</td>
                                <td>{sale.total}</td>
                                <td className='d-flex'>
                                    <Col >
                                        <Button variant='warning' onClick={()=> addSale(sale._id)}>
                                        <BsPaperclip/>
                                        </Button>
                                    </Col>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    </Table>
                ) : (
                    <MessageBox>NO DATA FOR "{searchText}"</MessageBox>
                )}
                </Col>
            )}
            <SaleDetailsModal show={showModal} onHide={() => setShowModal(false)} selectedSale={selectedSale} />
        </Row>
  )
}
