import { useState, useEffect } from 'react';
import './App.css';
import { formatINR } from './utils';

interface WishlistItem {
  id: string;
  listingId: string;
  productName: string;
  source: string;
  savedPrice: number;
  currentPrice: number;
  currency: string;
  addedAt: string;
  category: string;
  imageUrl?: string;
}

interface PriceAlert {
  id: string;
  listingId: string;
  productName: string;
  source: string;
  alertThreshold: number;
  currentPrice: number;
  currency: string;
  createdAt: string;
  triggered: boolean;
  triggeredAt: string | null;
}

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState<'search' | 'wishlist' | 'alerts'>('search');
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [alertThreshold, setAlertThreshold] = useState('');
  const [compareList, setCompareList] = useState<any[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  // Load wishlist on mount
  useEffect(() => {
    loadWishlist();
    loadAlerts();
  }, []);

  const loadWishlist = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/wishlist');
      if (response.ok) {
        const data = await response.json();
        setWishlist(data.items || []);
        setWishlistIds(new Set(data.items.map((item: WishlistItem) => item.listingId)));
      }
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/alerts');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
  };

  const openAlertModal = (item: any) => {
    setSelectedProduct(item);
    setAlertThreshold(String(Math.floor(item.price * 0.9 / 100))); // Suggest 10% off in rupees
    setShowAlertModal(true);
  };

  const closeAlertModal = () => {
    setShowAlertModal(false);
    setSelectedProduct(null);
    setAlertThreshold('');
  };

  const createAlert = async () => {
    if (!selectedProduct || !alertThreshold) {
      alert('Please enter a valid price threshold');
      return;
    }

    const thresholdInPaise = Math.floor(parseFloat(alertThreshold) * 100);
    
    if (thresholdInPaise <= 0 || thresholdInPaise >= selectedProduct.price) {
      alert('Alert price must be lower than current price');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: selectedProduct.id,
          productName: selectedProduct.productName,
          source: selectedProduct.source,
          alertThreshold: thresholdInPaise,
          currentPrice: selectedProduct.price,
          currency: selectedProduct.currency || 'INR',
        }),
      });

      if (response.ok) {
        await loadAlerts();
        alert('Price alert created successfully!');
        closeAlertModal();
      } else {
        alert('Failed to create alert');
      }
    } catch (err) {
      console.error('Failed to create alert:', err);
      alert('Failed to create alert');
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/alerts/${alertId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadAlerts();
      } else {
        alert('Failed to delete alert');
      }
    } catch (err) {
      console.error('Failed to delete alert:', err);
      alert('Failed to delete alert');
    }
  };

  const toggleCompare = (item: any) => {
    const isInCompare = compareList.some(p => p.id === item.id);
    
    if (isInCompare) {
      setCompareList(compareList.filter(p => p.id !== item.id));
    } else {
      if (compareList.length >= 4) {
        alert('You can only compare up to 4 products at a time');
        return;
      }
      setCompareList([...compareList, item]);
    }
  };

  const clearComparison = () => {
    setCompareList([]);
    setShowComparison(false);
  };

  const removeFromComparison = (itemId: string) => {
    setCompareList(compareList.filter(p => p.id !== itemId));
    if (compareList.length <= 1) {
      setShowComparison(false);
    }
  };

  const addToWishlist = async (item: any) => {
    try {
      const response = await fetch('http://localhost:3000/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: item.id,
          productName: item.productName,
          source: item.source,
          savedPrice: item.price,
          currentPrice: item.price,
          currency: item.currency || 'INR',
          category: item.category || 'General',
          imageUrl: item.imageUrl,
        }),
      });

      if (response.ok) {
        await loadWishlist();
        alert('Added to wishlist!');
      } else if (response.status === 409) {
        alert('Already in wishlist!');
      } else {
        alert('Failed to add to wishlist');
      }
    } catch (err) {
      console.error('Failed to add to wishlist:', err);
      alert('Failed to add to wishlist');
    }
  };

  const removeFromWishlist = async (itemId: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/wishlist/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadWishlist();
      } else {
        alert('Failed to remove from wishlist');
      }
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
      alert('Failed to remove from wishlist');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search term');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      setResults(data.listings || []);
    } catch (err) {
      setError('Failed to fetch results. Make sure the backend is running on port 3000.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🛒 PRO Market Dashboard</h1>
        <p>Search and compare products across multiple marketplaces</p>
        <div className="nav-buttons">
          <button 
            className={`nav-button ${activeView === 'search' ? 'active' : ''}`}
            onClick={() => {
              setActiveView('search');
              setShowComparison(false);
            }}
          >
            Search
          </button>
          <button 
            className={`nav-button ${activeView === 'wishlist' ? 'active' : ''}`}
            onClick={() => {
              setActiveView('wishlist');
              setShowComparison(false);
            }}
          >
            Wishlist ({wishlist.length})
          </button>
          <button 
            className={`nav-button ${activeView === 'alerts' ? 'active' : ''}`}
            onClick={() => {
              setActiveView('alerts');
              setShowComparison(false);
            }}
          >
            Alerts ({alerts.length})
          </button>
        </div>
      </header>

      {activeView === 'search' && (
        <>
          <div className="search-container">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="search-input"
              />
              <button onClick={handleSearch} className="search-button" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
            
            {error && <p className="error">{error}</p>}
          </div>

          <div className="results-container">
            {loading && <p className="loading">Loading...</p>}
            
            {!loading && results.length === 0 && searchQuery && !error && (
              <p className="no-results">No results found. Try a different search term.</p>
            )}
            
            {!loading && results.length > 0 && !showComparison && (
              <>
                <h2>Found {results.length} Results</h2>
                {compareList.length > 0 && (
                  <div className="compare-banner">
                    <p>{compareList.length} product(s) selected for comparison</p>
                    <div className="compare-banner-actions">
                      <button 
                        className="btn-compare"
                        onClick={() => setShowComparison(true)}
                        disabled={compareList.length < 2}
                      >
                        Compare Now
                      </button>
                      <button 
                        className="btn-clear-compare"
                        onClick={clearComparison}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
                <div className="results-grid">
                  {results.map((item, index) => {
                    const isInCompare = compareList.some(p => p.id === item.id);
                    return (
                      <div key={index} className="product-card">
                        <div className="compare-checkbox-container">
                          <input
                            type="checkbox"
                            id={`compare-${item.id}`}
                            checked={isInCompare}
                            onChange={() => toggleCompare(item)}
                            className="compare-checkbox"
                          />
                          <label htmlFor={`compare-${item.id}`} className="compare-label">
                            Compare
                          </label>
                        </div>
                        <h3>{item.productName || 'Product'}</h3>
                        <p className="source">Source: {item.source || 'Unknown'}</p>
                        <p className="price">{formatINR(item.price)}</p>
                        <p className="rating">⭐ {item.rating || 'N/A'} ({item.reviewCount || 0} reviews)</p>
                        <p className="category">{item.category || 'General'}</p>
                        <div className="card-actions">
                          <button 
                            className={`wishlist-button ${wishlistIds.has(item.id) ? 'in-wishlist' : ''}`}
                            onClick={() => addToWishlist(item)}
                            disabled={wishlistIds.has(item.id)}
                          >
                            {wishlistIds.has(item.id) ? '✓ In Wishlist' : '♡ Add to Wishlist'}
                          </button>
                          <button 
                            className="alert-button"
                            onClick={() => openAlertModal(item)}
                          >
                            🔔 Set Alert
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            
            {!loading && results.length === 0 && !searchQuery && (
              <div className="welcome">
                <h2>Welcome to PRO Market Dashboard</h2>
                <p>Try searching for:</p>
                <ul>
                  <li>laptop</li>
                  <li>mobile</li>
                  <li>headphones</li>
                  <li>gold</li>
                  <li>silver</li>
                  <li>watch</li>
                  <li>shoes</li>
                  <li>book</li>
                  <li>saree</li>
                  <li>mixer</li>
                </ul>
                <p style={{ marginTop: '30px', fontSize: '1rem', opacity: 0.8 }}>
                  Search from 100+ products across Electronics, Jewelry, Clothing, Home & Kitchen, Sports, Books, Beauty, and more!
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {activeView === 'wishlist' && (
        <div className="wishlist-container">
          <h2>My Wishlist</h2>
          {wishlist.length === 0 ? (
            <div className="empty-wishlist">
              <p>Your wishlist is empty</p>
              <button onClick={() => setActiveView('search')} className="search-button">
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="results-grid">
              {wishlist.map((item) => (
                <div key={item.id} className="product-card wishlist-item">
                  <h3>{item.productName}</h3>
                  <p className="source">Source: {item.source}</p>
                  <p className="price">{formatINR(item.currentPrice)}</p>
                  <p className="category">{item.category}</p>
                  <p className="saved-date">Added: {new Date(item.addedAt).toLocaleDateString()}</p>
                  <button 
                    className="remove-button"
                    onClick={() => removeFromWishlist(item.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === 'alerts' && (
        <div className="alerts-container">
          <h2>Price Alerts</h2>
          {alerts.length === 0 ? (
            <div className="empty-alerts">
              <p>You have no active price alerts</p>
              <button onClick={() => setActiveView('search')} className="search-button">
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="alerts-list">
              {alerts.map((alert) => (
                <div key={alert.id} className="alert-card">
                  <div className="alert-header">
                    <h3>{alert.productName}</h3>
                    <button 
                      className="delete-alert-button"
                      onClick={() => deleteAlert(alert.id)}
                      title="Delete alert"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="source">Source: {alert.source}</p>
                  <div className="alert-prices">
                    <div className="price-info">
                      <span className="label">Current Price:</span>
                      <span className="value current">{formatINR(alert.currentPrice)}</span>
                    </div>
                    <div className="price-info">
                      <span className="label">Alert When Below:</span>
                      <span className="value threshold">{formatINR(alert.alertThreshold)}</span>
                    </div>
                  </div>
                  <div className="alert-status">
                    <span className={`status-badge ${alert.triggered ? 'triggered' : 'active'}`}>
                      {alert.triggered ? '✓ Triggered' : '● Active'}
                    </span>
                    <span className="created-date">
                      Created: {new Date(alert.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comparison View */}
      {showComparison && compareList.length >= 2 && (
        <div className="comparison-view">
          <div className="comparison-header">
            <h2>Product Comparison</h2>
            <button onClick={() => setShowComparison(false)} className="btn-back">
              ← Back to Results
            </button>
          </div>
          
          <div className="comparison-table-container">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th className="attribute-column">Attribute</th>
                  {compareList.map((item) => (
                    <th key={item.id} className="product-column">
                      <div className="product-header">
                        <button 
                          className="remove-from-compare"
                          onClick={() => removeFromComparison(item.id)}
                          title="Remove from comparison"
                        >
                          ✕
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="attribute-label">Product Name</td>
                  {compareList.map((item) => (
                    <td key={item.id} className="product-value">
                      <strong>{item.productName}</strong>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="attribute-label">Source</td>
                  {compareList.map((item) => (
                    <td key={item.id} className="product-value source-value">
                      {item.source}
                    </td>
                  ))}
                </tr>
                <tr className="highlight-row">
                  <td className="attribute-label">Price</td>
                  {compareList.map((item) => {
                    const isLowest = item.price === Math.min(...compareList.map(p => p.price));
                    return (
                      <td key={item.id} className={`product-value price-value ${isLowest ? 'best-price' : ''}`}>
                        {formatINR(item.price)}
                        {isLowest && <span className="best-badge">Lowest</span>}
                      </td>
                    );
                  })}
                </tr>
                <tr className="highlight-row">
                  <td className="attribute-label">Rating</td>
                  {compareList.map((item) => {
                    const isHighest = item.rating === Math.max(...compareList.map(p => p.rating));
                    return (
                      <td key={item.id} className={`product-value rating-value ${isHighest ? 'best-rating' : ''}`}>
                        ⭐ {item.rating}
                        {isHighest && <span className="best-badge">Highest</span>}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="attribute-label">Reviews</td>
                  {compareList.map((item) => (
                    <td key={item.id} className="product-value">
                      {item.reviewCount.toLocaleString()} reviews
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="attribute-label">Category</td>
                  {compareList.map((item) => (
                    <td key={item.id} className="product-value">
                      <span className="category-badge">{item.category}</span>
                    </td>
                  ))}
                </tr>
                <tr className="highlight-row">
                  <td className="attribute-label">Composite Score</td>
                  {compareList.map((item) => {
                    const isHighest = item.compositeScore === Math.max(...compareList.map(p => p.compositeScore));
                    return (
                      <td key={item.id} className={`product-value score-value ${isHighest ? 'best-score' : ''}`}>
                        {item.compositeScore}/100
                        {isHighest && <span className="best-badge">Best</span>}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="attribute-label">Actions</td>
                  {compareList.map((item) => (
                    <td key={item.id} className="product-value">
                      <div className="comparison-actions">
                        <button 
                          className="btn-wishlist-small"
                          onClick={() => addToWishlist(item)}
                          disabled={wishlistIds.has(item.id)}
                        >
                          {wishlistIds.has(item.id) ? '✓ In Wishlist' : '♡ Wishlist'}
                        </button>
                        <button 
                          className="btn-alert-small"
                          onClick={() => {
                            setShowComparison(false);
                            openAlertModal(item);
                          }}
                        >
                          🔔 Alert
                        </button>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="comparison-footer">
            <button onClick={clearComparison} className="btn-clear-all">
              Clear All & Start Over
            </button>
          </div>
        </div>
      )}

      {/* Price Alert Modal */}
      {showAlertModal && selectedProduct && (
        <div className="modal-overlay" onClick={closeAlertModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Set Price Alert</h3>
            <div className="modal-product-info">
              <h4>{selectedProduct.productName}</h4>
              <p className="source">Source: {selectedProduct.source}</p>
              <p className="current-price">Current Price: {formatINR(selectedProduct.price)}</p>
            </div>
            <div className="modal-form">
              <label htmlFor="alert-threshold">
                Alert me when price drops below (₹):
              </label>
              <input
                id="alert-threshold"
                type="number"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(e.target.value)}
                placeholder="Enter price in rupees"
                className="alert-input"
                min="1"
                max={Math.floor(selectedProduct.price / 100)}
              />
              <p className="help-text">
                Current: {formatINR(selectedProduct.price)} | 
                10% off: {formatINR(Math.floor(selectedProduct.price * 0.9))}
              </p>
            </div>
            <div className="modal-actions">
              <button onClick={createAlert} className="btn-create-alert">
                Create Alert
              </button>
              <button onClick={closeAlertModal} className="btn-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
