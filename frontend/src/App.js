import LoginScreen from "./screens/LoginScreen";
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from "./components/ProtectedRoutes";
import ProductEdit from "./screens/ProductEdit";
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import { ToastContainer } from "react-toastify";
import Nav from "react-bootstrap/Nav";
import Navbar from 'react-bootstrap/Navbar'
import {BsBoxArrowRight, BsGrid1X2Fill, BsPieChartFill} from 'react-icons/bs'
import { useContext } from "react";
import { Store } from "./utils/Store";
import PrintStock from "./screens/PrintStock";
import StatScreen from "./screens/StatScreen";
import Dashboard from "./screens/Dashboard";
import { newDate } from "./utils/Date";


function App() {

  const {state, dispatch: ctxDispatch} = useContext(Store);
  const {userInfoToken} = state;
  
  
  function signoutHandler(){

    ctxDispatch({type: 'SIGN_OUT'})
    localStorage.removeItem('userInfoToken');
    window.location.href = '/'
  }

  const currentDate = newDate()
  const systemDate = localStorage.getItem('previousDate')
  if(!systemDate){
    localStorage.setItem('previousDate', currentDate)
  }else if(systemDate !== currentDate){
    localStorage.removeItem('todaySales')
  }
  
  return (
  <BrowserRouter>
  <Navbar expand='lg' bg="dark" variant="dark" className="p-4" > 
      <Navbar.Brand href="/">
        <span className="border p-2">Active as: {userInfoToken? userInfoToken.name: 'Home'}</span>
      </Navbar.Brand>
        <Navbar.Toggle aria-controls="nav-bar-basic"/>
        <Navbar.Collapse id="nav-bar-basic">
        <Nav className="m-auto justify-content-center fs-5">
          <Nav.Link href="/dashboard">
            <span className="p-3 mb-2">
              <BsGrid1X2Fill/>
            </span>
            Dashboard
          </Nav.Link>
          <Nav.Link href="/stats">
            <span className="p-3 mb-2">
              <BsPieChartFill/>
            </span>
            Records
          </Nav.Link>
          <Nav.Link href="#">
            <span className="p-3 mb-2">
              <BsPieChartFill/>
            </span>
            Gallery
          </Nav.Link>
        </Nav>
        
        <div className="d-flex align-items-end">
          <Nav>
            <Nav.Link>
              <span className="p-lg-3" onClick={signoutHandler}>Log out</span>
              <BsBoxArrowRight />
            </Nav.Link>
          </Nav>
        </div>
      </Navbar.Collapse>
    </Navbar>

    <ToastContainer position="bottom-center" limit={1} />
    <Routes>
      <Route path="/" element={<LoginScreen />} />
      <Route path="/dashboard" element ={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>}/>


      <Route path="/api/product/update/:id" element={
        <ProtectedRoute>
          <ProductEdit />
        </ProtectedRoute>
      }/>

      <Route path="print-inventory" element={
        <ProtectedRoute>
          <PrintStock />
        </ProtectedRoute>
      }
      />
      <Route path="/stats" element={
        <ProtectedRoute>
          <StatScreen/>
        </ProtectedRoute>
      }
      />
    </Routes>
    </BrowserRouter>
  );
}

export default App;
