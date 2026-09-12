import { useEffect, useState } from "react";
import "./App.css";

export default function App() {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => {
        if (!res.ok) throw new Error(`Backend returned ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setProducts(data.products || []);
        setStatus("ready");
      })
      .catch((err) => {
        setError(err.message);
        setStatus("error");
      });
  }, []);

  return (
    <div className="shop">
      <header className="shop-header">
        <h1>ShopEasy</h1>
        <p>Online shopping &amp; delivery</p>
	<p className="promo-banner">Free delivery on every order this week</p>
      </header>

      {status === "loading" && <p className="state-msg">Loading products...</p>}
      {status === "error" && (
        <p className="state-msg error">
          Could not reach backend: {error}. Is the "backend" service up?
        </p>
      )}

      {status === "ready" && (
        <div className="product-grid">
          {products.map((p) => (
            <div className="product-card" key={p.id}>
              <h3>{p.name}</h3>
              <p>{p.description}</p>
              <div className="product-footer">
                <span className="price">${Number(p.price).toFixed(2)}</span>
                <span className="stock">{p.stock} in stock</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
