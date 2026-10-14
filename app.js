App.js
JavaScript
import { useState } from "react";
import axios from "axios";
import SearchBar from "./components/SearchBar";
import PriceCard from "./components/PriceCard";
import ChartBox from "./components/ChartBox";
import "./App.css";

function App() {
  const [coin, setCoin] = useState("bitcoin");
    const [price, setPrice] = useState(null);
    const [chartData, setChartData] = useState([]);
    const getData = async (c) => {
      setCoin(c);
      const priceRes = await axios.get(`http://localhost:5000/price/${c}`);
      const chartRes = await axios.get(`http://localhost:5000/chart/${c}`);
      setPrice(priceRes.data[c]);
      setChartData(chartRes.data);
    };

  return (
    <div className="container">
      <h1>📊 PRO Market Dashboard</h1>

      <SearchBar onSearch={getData} />

      <PriceCard coin={coin} price={price} />

      <ChartBox data={chartData} />
    </div>
  );
}

