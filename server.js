JavaScript
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

// 🔥 Get current price
app.get("/price/:coin", async (req, res) => {
    try {
        const coin = req.params.coin.toLowerCase();

        const response = await axios.get(
            https,//api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=inr,usd
        );

        res.json(response.data);
    } catch (err) {
        res.json({ error: "Coin not found" });
    }
});

// 📊 Get 7-day chart data
app.get("/chart/:coin", async (req, res) => {
    try {
        const coin = req.params.coin.toLowerCase();

        const response = await axios.get(
            https,//api.coingecko.com/api/v3/coins/${coin}/market_chart?vs_currency=inr&days=7
        );

        res.json(response.data.prices);
    } catch (err) {
        res.json({ error: "Chart data not found" });
    }
});

app.listen(5000, () => {
    console.log("Backend running on http://localhost:5000");
});