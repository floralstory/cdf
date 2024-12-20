import React, { useState, useContext} from 'react';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/esm/Form'
import Button from 'react-bootstrap/esm/Button'
import Col from 'react-bootstrap/esm/Col'
import Row from 'react-bootstrap/esm/Row'
import axios from 'axios'
import { Store } from '../utils/Store';
import {getError} from '../utils/getError'
import { BsCamera} from 'react-icons/bs';
import { round2 } from '../utils/helpers';
import MessageBox from './MessageBox'
import {toast} from 'react-toastify'
import {BsBoxArrowDown, BsPlusSquare, BsFillTrash3Fill} from 'react-icons/bs'



const SaleTable =()=> {

  const [products, setProducts] = useState([]);
  const [paidBy,  setPaidBy]= useState('')
  const [service, setService]= useState('')
  const [name, setCustomerName] = useState('')
  const [phone, setPhoneNumber] = useState('')
  const [preparedBy, setPreparedBy]= useState('')
  const [deliveredTo, setdeliveredTo] = useState('')
  const [free, setFree] = useState(false)
  const [driver, setDriver]= useState('')
  const [orderedBy, setorderedBy]= useState('')
  const [discount, setDiscount] = useState(0)
  const [recievedBy, setrecievedBy]= useState('')

 
 

const time = new Date().toLocaleDateString('en-GB');
  

const { state, dispatch: ctxDispatch} = useContext(Store);
const { userInfoToken } = state;


  const handleAddRow=()=> {
    setProducts([...products, {name:"", price: 0, quantity: 0, arrangement:"", photo: "", loading: false}]);
  }

  const handleReset=()=> {
    setProducts([])
  }

  function handleSelectedValue(setState){
    return function(e){
      const selectedValue = e.target.value

      setState(selectedValue)
    }
  }
  
  const handleProductChange = (index, event) => {
    const newProducts = [...products];
    newProducts[index] = { ...newProducts[index], [event.target.name]: event.target.value };
    setProducts(newProducts);
  };

  const handleArrangementChange = (index, event) => {
    const newProducts = [...products];
    newProducts[index] = { ...newProducts[index], [event.target.name]: event.target.value };
    setProducts(newProducts);
  };

  const handleQuantityChange = (index, event) => {
    const newProducts = [...products];
    newProducts[index].quantity = parseInt(event.target.value, 10) || 0;
    setProducts(newProducts);
  };

  ////UPLOAD PHOTO/PHOTOS
const uploadFileHandler = async(file)=>{
  try{
   const bodyFormData = new FormData()
   bodyFormData.append('file', file)
   const {data} = await axios.post('/api/upload/', bodyFormData, {
     headers :{
       'Content-Type': 'multipart/form-data',
       authorization: `Bearer ${userInfoToken.token}`,
     }
   })
   return data.secure_url
  }catch(error){
  //    setLoading(false)
   getError(error)
  }
 }


 const handleCaptureImage = async (index, image) => {
  const newProducts = [...products];
  if(image){
    try{
    newProducts[index].loading = true
    //setProducts(newProducts)

    const photoUrl = await uploadFileHandler(image)
    newProducts[index].photo = photoUrl
    //newProducts[index].loading = false
  }catch(error){
    toast.error(error || 'error occured')
    console.log(error)
  }finally{
    newProducts[index].loading = false;
    setProducts(newProducts)
  }}};

  let totalWithoutVat = 0;


  const calculateSubTotal =()=> {
    const itemsTotalWithVat = products.reduce((accumulator, product) => accumulator + (product.quantity * product.price), 0);
    let subTotal = itemsTotalWithVat
    if(discount){
      subTotal -= discount
    }
    return totalWithoutVat = subTotal / 1.05
  }

  const calculateVat = () => {
    const vat = round2(totalWithoutVat * (5 / 100))
    return vat;
  };
  
  const calculateTotal = () => {
    return calculateSubTotal() + calculateVat()
  };

  

  
  const total = calculateTotal().toFixed(2);
  const subTotal = calculateSubTotal().toFixed(2);
  const vat = calculateVat().toFixed(2);

  const handleSave = async(e)=> {
  e.preventDefault()

  const selectFields =[name, phone, service, paidBy, preparedBy];
  const submitProducts = [...products]
  const hasEmptyValues = selectFields.some((value)=> value === '')
  const hasNullValues = submitProducts.some(row => Object.values(row).some(value => value === ''))

if(hasEmptyValues ){
  toast.error('Check Sale Fields for empty data')
  return
}
if(hasNullValues){
  toast.error('check Table Data for empty values')
  return
}

    try{
        
        const response = await axios.post('/api/sale/new-sale', {
        products, discount,
        paidBy, driver,
        service, recievedBy,
        name, deliveredTo,
        phone, orderedBy,
        preparedBy, total,
        time,
        subTotal,
        vat, free, 
      },
     )
     const data = response.data.sale
     ctxDispatch({type:"ADD_NEW_SALE", payload: data})
     toast.success('Success')
      }catch(error){
        toast.error(getError(error))
      }
      
}

  return (
    <>
    <Row className='d-flex justify-content-between my-2'>
    <Col sm={2}>
    <Form.Label>Paid By</Form.Label>
    <Form.Select onChange={handleSelectedValue(setPaidBy)}>
      <option>Select...</option>
      <option>Card</option>
      <option>Cash</option>
      <option>TapLink</option>
      <option>Bank Transfer</option>
    </Form.Select>
    </Col>

    <Col sm={2}>
    <Form.Label>Service</Form.Label>
    <Form.Select onChange={handleSelectedValue(setService)} required>
      <option>Select...</option>
      <option>Delivery</option>
      <option>Store Pick Up</option>
      <option>website</option>
      <option>insta-shop</option>
      <option>Delivero</option>
      <option>Careem</option>
    </Form.Select>
    </Col>
    <Col sm={2}>
    <Form.Label>prepared By</Form.Label>
    <Form.Select onChange={handleSelectedValue(setPreparedBy)} required>
      <option>choose..</option>

      <option>Joe</option>
      <option>Allan</option>
      <option>Adel</option>
      <option>Mahel</option>
      <option>Ahmed</option>
      <option>MJ</option>
    </Form.Select>
    </Col>
    <Col className='' sm={2}>
      <Form.Label>Customer Name:</Form.Label>
      <Form.Control
      type='text'
      value={name || ''}
      name='customerName'
      placeholder='customer name'
      onChange={(e)=> setCustomerName(e.target.value)}
      />
    </Col>
    <Col sm={2}>
      <Form.Label>Customer Tel:</Form.Label>
    <Form.Control
      required
      type='text'
      name='phone'
      value={phone || ''}
      placeholder='customer number'
      onChange={(e)=> setPhoneNumber(e.target.value)}
      />
    </Col>
    </Row>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Arrangement</th>
            <th>Price</th>
            <th>Quantity</th>
{/*             <th>Total</th>
 */}            <th>Photo</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => (
            <tr key={index}>
              <td>
                <Form.Control
                  required
                  type="text"
                  name="name"
                  value={product.name || ''}
                  onChange={(event) => handleProductChange(index, event)}
                />
              </td>
              <td>
                <Form.Control
                  required
                  type="text"
                  name="arrangement"
                  value={product.arrangement || ''}
                  onChange={(event) => handleArrangementChange(index, event)}
                />
              </td>
              <td>
                <Form.Control
                  required
                  type="number"
                  name="price"
                  value={product.price || ''}
                  onChange={(event) => handleProductChange(index, event)}
                />
              </td>
              <td>
                <Form.Control
                  required
                  type="number"
                  value={product.quantity || ''}
                  onChange={(event) => handleQuantityChange(index, event)}
                />
              </td>
{/*               <td>{product.price && product.quantity ? (product.price * product.quantity) - ((product.price * product.quantity) * 0.05) - discount : 0}</td>
 */}            <td>
          <label htmlFor={`fileInput-${index}`}>
            <BsCamera size={20} />
          </label>
          <input
            id={`fileInput-${index}`}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => handleCaptureImage(index, event.target.files[0])}
            style={{ display: 'none' }}
          />
          {product.loading ? (<span>wait..</span>) : (product.photo && !product.loading &&(<span>Done</span>))}
        </td>
        </tr>
          ))}
        </tbody>
      </Table>
      <Row className='d-flex justify-content-between my-3'>
      <Col md={4}>
      <Button variant='dark' onClick={handleAddRow} className='m-2'>
      <BsPlusSquare/><span className='mx-2'>Add</span>
    </Button>
    </Col>
      <Col md={4}>
      {products.length > 0 ? (
      <Button variant='dark' onClick={handleSave} className='m-2'>
      <BsBoxArrowDown/><span className='mx-2'>save</span>
    </Button>) : (
      <Button variant='dark' disabled className='m-2'>
      <BsBoxArrowDown/><span className='mx-2'>save</span>
    </Button>
    )}
      </Col>
      <Col md={4}>
      <Button variant='dark' onClick={handleReset} className='m-2'>
      <BsFillTrash3Fill/><span className='mx-2'>Reset</span>
      </Button>
      </Col>
      <Col>
      <Form.Check type='checkbox'
        label='Free Of Charge(F.O.C)'
        checked={free}
        className='py-2 mt-3'
        onChange={(e)=>setFree(e.target.checked)}
      />
      {free ? (
        <div className='p-2 border'>
           <Form.Group>
            <Form.Label>Orderd By</Form.Label>
            <Form.Control type='input'
            required
            value={orderedBy}
            onChange={(e)=>setorderedBy(e.target.value)}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Delivery Area</Form.Label>
            <Form.Control type='input'
            required
            value={deliveredTo}
            onChange={(e)=> setdeliveredTo(e.target.value)}
        />
          </Form.Group>
          <Form.Group>
            <Form.Label>Recieved By</Form.Label>
            <Form.Control type='input'
            required
            value={recievedBy}
            onChange={(e)=>setrecievedBy(e.target.value)}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Driver</Form.Label>
            <Form.Control type='input'
            required
            value={driver}
            onChange={(e)=>setDriver(e.target.value)}
            />
          </Form.Group>
        </div>
      ): (<MessageBox variant='warning'>Not F.O.C</MessageBox>)}
      </Col>
    </Row>
      <div className='border p-2'>
      <p>NET AMOUNT: 
        <strong>
          {subTotal}
        </strong>
      </p>
      <Col className='d-flex justify-content-between'>
      <Form.Label>DISCOUNT: <strong>{discount}</strong></Form.Label>
      <Form.Control type='number' style={{width:'12rem'}}
        value={discount}
        onChange={(e)=> setDiscount(e.target.value)}
        placeholder='discount'
        lable="discount"
      />
      </Col>
      <p>VAT: 
        <strong>
          {vat}
        </strong>
      </p>
      <p>AMOUNT: 
        <strong>
          {total}
        </strong>
      </p>
      </div>
      </>
  );
}

export default SaleTable;
