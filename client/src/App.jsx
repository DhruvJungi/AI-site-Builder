import React from 'react'
import { Route, Routes } from "react-router-dom"
import {GuestLayout, AuthLayout} from './pages/Layout'
import Authpage from './pages/Authpage'

const App = () => {
  return (
    <Routes>
      {/* login Routes */}
      <Route element={<GuestLayout/>}>
        <Route path='/login' element={<Authpage mode="login" />}/>
        <Route path='/register' element={<Authpage mode="register" />}/>      
      </Route>

      {/* Proctected Routes */}
      <Route element={<AuthLayout/>}>
        <Route path='/' element={<HomePage />}/>
        <Route path='/builder/:id' element={<BuilderPage />}/>
        <Route path='/preview/:id' element={<PreviewPage />}/>    
      </Route>

    </Routes>
  )
}

export default App