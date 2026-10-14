JavaScript
function PriceCard({ coin, price }) {
  if (!price) return <h3>Loading...</h3>;

  return (
    <div className="card">
      <h2>{coin.toUpperCase()}</h2>
      <p>💰 INR: ₹{price.inr}</p>
      <p>💵 USD: ${price.usd}</p>
    </div>
  );
}