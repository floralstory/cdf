import React, { useState, useEffect } from 'react';
import { Chart } from 'react-google-charts';
import axios from 'axios';

export default function Graphs() {
  const [chartData, setChartData] = useState([]);

  // Function to fetch data
  const getData = async () => {
    try {
      const { data } = await axios.get('/api/transactions/visualize');

    setChartData(data); 
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    getData();
  }, []); 

  return (
    <div>
      <h2>Transaction Overview</h2>
      <Chart
        chartType="ScatterChart"
        width="100%"
        height="400px"
        loader={<div>Loading Chart</div>}
        data={chartData}
        options={{
          title: 'Transaction Data',
          hAxis: { title: 'Time', format: 'yyyy-MM' }, // Format the x-axis as year-month
          vAxis: { title: 'Amount' },
          curveType: 'function',
          lineWidth: 1,
          intervals: { style: 'bars' },
          explorer: {
            actions: ['dragToZoom', 'rightClickToReset'], // Enable zooming and right-click reset
            axis: 'horizontal', // Focus the explorer on the x-axis (time)
            keepInBounds: true, // Prevent the zoom from going out of bounds
            maxZoomIn: 2, // Adjust zoom level if needed
          },
        }}
      />
    </div>
  );
}
