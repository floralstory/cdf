import React, { useEffect, useReducer, useRef, useState } from 'react';
import Row from 'react-bootstrap/Row';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Table from 'react-bootstrap/esm/Table';
import Calendar from 'react-calendar';
import Button from 'react-bootstrap/esm/Button';
import { useReactToPrint } from 'react-to-print';
import axios from 'axios';
import MessageBox from './MessageBox';

const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_DATA":
      return { ...state, loading: true };
    case "FETCH_DATA_DONE":
      return { ...state, loading: false, data: action.payload };
    default:
      return state;
  }
}

const TableTemplate = ({ type, data }) => {
  switch (type) {
    case 'purchase':
      return (
        <Table bordered responsive className='printable'>
          <thead>
            <tr>
              <th>Delivery Note</th>
              <th>Date</th>
              <th>Item(s)</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(data) && data?.map(purchase => (
              <tr key={purchase._id}>
                <td>{purchase.deliveryNote}</td>
                <td>{purchase.createdAt ? new Date(purchase.createdAt).toISOString().split('T')[0] : ''}</td>
                <td>
                  <ul>
                    {(purchase.Items || []).map((item, index) => (
                      <li key={index}>
                        {item.productName}: {item.quantity}
                      </li>
                    ))}
                  </ul>
                </td>
                <td>{purchase?.total}</td>
              </tr>
            ))}
            <tr>
              <td colSpan='3'><strong>TOTAL AMOUNT:</strong></td>
              <td>{data?.reduce((total, purchase)=> total +(purchase.total || 0), 0)}</td>
            </tr>
          </tbody>
        </Table>
      );
    case 'invoices':
      return (
        <Table bordered responsive className="printable">
          <thead>
            <tr>
              <th>Code</th>
              <th>Date</th>
              <th>Item(s)</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(data) && data?.map(row => (
              <tr key={row._id}>
                <td>{row.InvoiceCode}</td>
                <td>{row.createdAt ? new Date(row.createdAt).toISOString().split('T')[0] : ''}</td>
                <td>
                  <ul>
                    {(row.units || []).map((unit, index) => (
                      <li key={index}>
                        <strong>{unit.arrangement}</strong>
                        <ul>
                          {unit.products.map((product, idx) => (
                            <li key={idx}>
                              {product.quantity} <small className='px-2'>{product.productName}</small>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </td>
                <td>{row.total || 0}</td>
              </tr>
            ))}
            <tr>
              <td colSpan='3'><strong>TOTAL AMOUNT:</strong></td>
              <td>{data.reduce((acc, row)=> acc + (row.total || 0), 0)}</td>
            </tr>
          </tbody>
        </Table>
      );
    case 'sales':
      return (
        <Table bordered responsive className="printable">
          <thead>
            <tr>
              <th>Name</th>
              <th>Purchase</th>
              <th>Type</th>
              <th>Qty</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(data) && data?.map(row => (
              <tr key={row._id}>
                <td>{row.productName}</td>
                <td>{row.purchasePrice}</td>
                <td>{row.type}</td>
                <td>{row.quantity}</td>
                <td>{row.createdAt ? new Date(row.createdAt).toISOString().split('T')[0] : ''}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      );
    case 'closing':
      return (
        <Table bordered responsive className="printable">
          <thead>
            <tr>
              <th>Name</th>
              <th>Purchase</th>
              <th>Sale</th>
              <th>Damage</th>
              <th>In Stock</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(data) && data?.map((row, index) => (
              <React.Fragment key={index}>
                {row.products?.map((product, idx) => (
                  <tr key={`${index}-${idx}`}>
                    <td>{product.name || product.productName || ''}</td>
                    <td>{product.purchase || ''}</td>
                    <td>{product.sold || ''}</td>
                    <td>{product.waste || product.damaged || ''}</td>
                    <td>{product.closingStock || ''}</td>
                  </tr>
                ))}
                <tr>
                  <td><strong>Total Amount: (AED)</strong></td>
                  <td><strong>{row.totalPurchase || 0}</strong></td>
                  <td><strong>{row.totalSold || row.TotalSoldvalue || 0}</strong></td>
                  <td><strong>{row.totalWaste || row.TotalDamagesvalue || 0}</strong></td>
                  <td><strong>{row.totalClosingStock || row.closingStockvalue || 0}</strong></td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </Table>
      );
    case 'damages':
      return (
        <Table bordered responsive className="printable">
          <thead>
            <tr>
              <th>Name</th>
              <th>Purchase</th>
              <th>Type</th>
              <th>Qty</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {data?.map(row => (
              <tr key={row._id}>
                <td>{row.productName}</td>
                <td>{row.purchasePrice}</td>
                <td>{row.type}</td>
                <td>{row.quantity}</td>
                <td>{row.createdAt ? new Date(row.createdAt).toISOString().split("T")[0] : ''}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      );
    default:
      return (
        <MessageBox>SELECT DATE AND TYPE</MessageBox>
      );
  }
}

const DailyReport = () => {
  const initialState = {
    data: [],
    loading: true
  }
  const [{ data }, dispatch] = useReducer(reducer, initialState);
  const [type, setType] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCalendar, setShowCalendar] = useState(false);

  const toggleCalendar = () => {
    setShowCalendar(!showCalendar);
  }

  const tableRef = useRef();

  useEffect(() => {
    const getData = async () => {
      const formatedDate = new Date(date).toISOString().split('T')[0]
      try {
        dispatch({ type: "FETCH_DATA" });
        const { data } = await axios.get(`/api/transactions/daily-report?date=${formatedDate}&type=${type}`);
        dispatch({ type: "FETCH_DATA_DONE", payload: data });
      } catch (error) {
        console.error("Error fetching data:", error);
        // Optionally handle error state
      }
    };

    if (date && type) {
      getData();
    }
  }, [date, type]);

  return (
    <Container fluid>
      <Row className='my-2'>
        {['invoices', 'purchase', 'sales', 'damages', 'closing'].map((item) => (
          <Col key={item}>
            <Form.Check
              label={item}
              checked={type === item}
              onChange={() => setType(item)}
            />
          </Col>
        ))}
        <Col>
          <Button onClick={toggleCalendar}>
            CHOOSE DATE
          </Button>
          {showCalendar && (
            <div className='my-2'>
              <Calendar onChange={setDate} value={new Date(date)} />
            </div>
          )}
          <Button className='mx-2' onClick={useReactToPrint({ content: () => tableRef.current })}>
            Print
          </Button>
        </Col>
      </Row>
      <div ref={tableRef}>
        <h3>{type ? type.toUpperCase() : 'REPORT'}: {new Date().toLocaleString()}</h3>
        <TableTemplate data={data} type={type} />
      </div>
    </Container>
  );
}

export default DailyReport;
