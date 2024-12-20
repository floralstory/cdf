import React, { useState, useEffect, useContext } from 'react';
import { Row, Col, Table, Form, Button, Alert, Card} from 'react-bootstrap';
import axios from 'axios';
import { getError } from '../utils/getError';
import { toast } from 'react-toastify';
import Calendar from 'react-calendar';
import { FaEye } from 'react-icons/fa';
import { BsPencil, BsCheck2, BsXLg } from 'react-icons/bs';
import SaleDetailsModal from './SaleDetailsModal';
import { Store } from '../utils/Store';

export default function QuerySalesData(){
  const {state} = useContext(Store);
  const {userInfoToken} = state;

  // State to store query parameters
  const [query, setQuery] = useState({});

  // State to store sales data
  const [sales, setSales] = useState(null);
  const [selectedSale, setSelectedSale] = useState({});
  const [showModal, setShowModal] = useState(false);

  // State to store the total count of results
  const [totalCount, setTotalCount] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [focSales, setFocSales] = useState(0);
  const [paymentTotals, setPaymentTotals] = useState([])

  // State for editing
  const [editingSale, setEditingSale] = useState(null);
  const [paidBy,  setPaidBy]= useState('');
  const [service, setService]= useState('');
  const [date, setDate] = useState(new Date()); // Initialize with current date

  // Function to fetch sales data based on query parameters
  const fetchSales = async () => {
    if (Object.keys(query).length > 0) {
      try {
        const response = await axios.get('/api/sale/for', { params: query });
        setSales(response.data.sales);
        setTotalCount(response.data.totalCount);
        setTotalValue(response.data.totalValue);
        setFocSales(response.data.focSales);
        setPaymentTotals(response.data.paymentTotals)
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
  };

  // Function to handle viewing sale details
  const handleViewSale = async (saleId) => {
    try {
      const result = await axios.get(`/api/sale/get-sale/${saleId}`);
      setSelectedSale(result.data);
      setShowModal(true);
    } catch(error) {
      toast.error(getError(error));
    }
  };

  // Function to handle editing sale
  const handleEdit = async (sale) => {
    if(!userInfoToken.isAdmin){
      toast.error('YOUR ACCOUNT CAN\'T COMPLETE THIS ACTION')
      return
    }
    setEditingSale(sale);
  };

  const handleCancel = async()=>{
    setEditingSale(null)
  }

  // Function to update sale details
  const updateSale = async () => {
    try {
      await axios.put(`/api/sale/edit/${editingSale._id}`, {
        time: date.toLocaleDateString(),
        service: service,
        paidBy: paidBy
      });
      toast.success('Done')
      console.log('Sale updated successfully');
    } catch (error) {
      console.error('Error updating sale:', error);
    }
    setEditingSale(null); // Reset editing state
  };

  useEffect(() => {
    fetchSales();
  }, [query, userInfoToken, editingSale]);

  // Function to handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setQuery({ ...query, [name]: value });
  };

  const round2 = (num) => Math.round(num * 100 + Number.EPSILON) / 100;

  return (
    <div>
      <Row className="mb-3">
        <Col md={4}>
          <Form.Group>
            <Form.Label>Year</Form.Label>
            <Form.Control
              type="text"
              name="year"
              placeholder="Enter year"
              value={query.year || ''}
              onChange={handleInputChange}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Month</Form.Label>
            <Form.Control
              type="text"
              name="month"
              placeholder="Enter month"
              value={query.month || ''}
              onChange={handleInputChange}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Day</Form.Label>
            <Form.Control
              type="text"
              name="day"
              placeholder="Enter day"
              value={query.day || ''}
              onChange={handleInputChange}
            />
          </Form.Group>
        </Col>
      </Row>
      <Row className="mb-3">
        <Col>
          <Button variant="primary" onClick={fetchSales}>
            Search
          </Button>
        </Col>
      </Row>
      <Row>
        <Col>
          {sales !== null ? (
            <div>
              <div className='d-flex justify-content-between m-2'>
                <Card variant='warning'>
                  <Card.Body>Total Results: {totalCount}</Card.Body>
                </Card>
                <Card variant='warning'>
                  <Card.Body>Total value: {round2(totalValue)}</Card.Body>
                </Card>
                <Card variant='warning'>
                  <Card.Body>F.O.C. {round2(focSales)}</Card.Body>
                </Card>
              </div>
              <Row>
              {paymentTotals && paymentTotals.map((paymentMethod, index) => (
                  <Col key={index} className="m-3 border bg-primary text-light">
                    <Card.Title className='py-2'>
                      <strong>{paymentMethod.paymentMethod}</strong>
                    </Card.Title>
                    <p>{round2(paymentMethod.total)}</p>
                  </Col>
                ))
              }
            </Row>
              <Table bordered hover responsive>
                <thead>
                  <tr>
                    <th>Invoice Code</th>
                    <th>DATE</th>
                    <th>CUSTOMER</th>
                    <th>STATUS</th>
                    <th>SERVICE</th>
                    <th>PAID By</th>
                    <th>TOTAL</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
    <tr key={sale._id}>
      <td>
        <Button onClick={() => handleViewSale(sale._id)} className='bg-primary border'>
          <span className='px-1'>
            <FaEye/>
          </span>
          {sale.InvoiceCode}
        </Button>
      </td>
      <td>
        {editingSale && editingSale._id === sale._id ? (
          <Calendar onChange={setDate} value={date}/>
        ) : (
          sale.date
        )}
      </td>
      <td>{sale.name}</td>
      <td style={{backgroundColor: sale.free ? 'greenyellow' :  'transparent'}}>{sale.free === true ? 'F.O.C' : 'PAID'}</td>
      <td>
        {editingSale && editingSale._id === sale._id ? (
          <Form.Select onChange={(e) => setService(e.target.value)}>
            <option>Select...</option>
            <option>Delivery</option>
            <option>Store Pick Up</option>
            <option>website</option>
            <option>insta-shop</option>
            <option>Delivero</option>
            <option>Careem</option>
          </Form.Select>
        ) : (
          sale.service
        )}
      </td>
      <td>
        {editingSale && editingSale._id === sale._id ? (
          <Form.Select onChange={(e) => setPaidBy(e.target.value)}>
            <option>Select...</option>
            <option>Card</option>
            <option>Cash</option>
            <option>TapLink</option>
            <option>Bank Transfer</option>
          </Form.Select>
        ) : (
          sale.paidBy
        )}
      </td>
      <td>{sale.total}</td>
      <td>
        {!editingSale || editingSale._id !== sale._id ? (
          <BsPencil onClick={() => handleEdit(sale)}/>
        ) : (
          <div className='p-1 justify-content-between'>
          <BsCheck2 onClick={() => updateSale()} />
          <BsXLg onClick={() => handleCancel()} />
          </div>
        )}
      </td>
    </tr>
  ))}
</tbody>
              </Table>
              <SaleDetailsModal show={showModal} onHide={() => setShowModal(false)} selectedSale={selectedSale}/>
            </div>
          ) : (
            <Alert variant='warning'>No data</Alert>
          )}
        </Col>
      </Row>
    </div>
  );
}
