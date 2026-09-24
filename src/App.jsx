import React from 'react'
import { Toaster } from "react-hot-toast";
import  InvoicePage  from "@/pages/InvoicePage"; 

const App = () => {
  return (
    <div>
      <InvoicePage />
      <Toaster />
    </div>
  )
}

export default App
