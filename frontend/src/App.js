import LoginScreen from "./screens/LoginScreen";
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from "./components/ProtectedRoutes";
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import { ToastContainer } from "react-toastify";
import Nav from "react-bootstrap/esm/Nav";
import Badge from "react-bootstrap/esm/Badge";
import Navbar from 'react-bootstrap/esm/Navbar'
import {BsBoxArrowRight} from 'react-icons/bs'
import { useContext, useEffect } from "react";
import { Store } from "./utils/Store";
import Dashboard from "./screens/Dashboard";
import axios from "axios";
import { newDate } from "./utils/Date";
import Register from "./components/Register";


function App() {

  const {state, dispatch: ctxDispatch} = useContext(Store);
  const {userInfoToken} = state;
  
  
  function signoutHandler(){

    ctxDispatch({type: 'SIGN_OUT'})
    localStorage.removeItem('userInfoToken');
    window.location.href = '/'
  }

  useEffect(()=> {
    const getTodaySales = async()=>{
      const {data} = await axios.get('/api/sale/today-sales')
      console.log(data)
      localStorage.setItem('todaySales', JSON.stringify(data))
    }
    getTodaySales()
  })

  
  return (
  <BrowserRouter>
  <Navbar expand='lg' className=" p-3 bg-dark text-light"> 
      <Navbar.Brand href="/">
        <Badge variant="dark">{userInfoToken ? userInfoToken.name.toUpperCase() : 'Home'}</Badge>
      </Navbar.Brand>
        <Navbar.Toggle aria-controls="nav-bar-basic"/>
        <Navbar.Collapse id="nav-bar-basic">
        <Nav className="m-auto justify-content-center fs-5">{newDate()}</Nav>
        <Badge className="d-flex align-items-end bg-warning">
          <Nav>
            {userInfoToken && <Register/>}
            <Nav.Link>
              <span className="p-lg-3 text-light" onClick={signoutHandler}>Log out</span>
              <BsBoxArrowRight color="red"/>
            </Nav.Link>
          </Nav>
        </Badge>
      </Navbar.Collapse>
    </Navbar>

    <ToastContainer position="bottom-center" limit={1} />
    <Routes>
      <Route path="/" element={<LoginScreen />} />
      <Route path="/dashboard" element ={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>}/>
    </Routes>
    </BrowserRouter>
  );
}

export default App;
