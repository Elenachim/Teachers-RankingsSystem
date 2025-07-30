import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { SEARCH_API } from '../config/config';

const Search = ({ isOpen, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const searchTimer = setTimeout(async () => {
            if (searchQuery.trim().length < 2) {
                setSearchResults([]);
                return;
            }

            setLoading(true);
            try {
                const response = await axios.get(`${SEARCH_API}?q=${encodeURIComponent(searchQuery)}`);
                if (response.data.success) {
                    setSearchResults(response.data.data || []);
                }
            } catch (error) {
                console.error('Search error:', error);
                setSearchResults([]);
            }
            setLoading(false);
        }, 300);

        return () => clearTimeout(searchTimer);
    }, [searchQuery]);

    const handleSearch = (e) => {
        e.preventDefault();
    };

    const handleResultClick = (result) => {
        onClose();
        navigate(`/rankinglist`, {
          state: {
            search: result.fullname,
            highlight: result.id
          }
        });
      };

    const renderResults = () => {
        if (!searchResults || searchResults.length === 0) return null;

        return (
            <div className="search-results-container" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <div className="row g-3">
                    {searchResults.map((result, index) => (
                        <div key={index} className="col-12 col-md-6 col-lg-4">
                            <div
                                className="card h-100 shadow-sm hover-overlay"
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleResultClick(result)}
                            >
                                <div className="card-body">
                                    <h5 className="card-title text-truncate">{result.fullname}</h5>
                                    <div className="mb-2">
                                        <span className="badge bg-primary me-2">#{result.ranking}</span>
                                       
                                    </div>
                               
                                    {result.notes && (
                                        <p className="card-text small text-truncate">{result.notes}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="search-overlay position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50" style={{ zIndex: 1050 }}>
            <div className="position-absolute top-50 start-50 translate-middle w-100 px-4">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-10">
                            <div className="card border-0 shadow-lg">
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h3 className="mb-0">Γενική Αναζήτηση</h3>
                                        <button className="btn-close" onClick={onClose}></button>
                                    </div>
                                    <form onSubmit={handleSearch}>
                                        <div className="input-group">
                                            <input
                                                type="text"
                                                className="form-control form-control-lg"
                                                placeholder="Αναζητήστε με Eπώνυμο και Όνομα ..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                autoFocus
                                            />
                                            <button
                                                className="btn btn-primary btn-lg"
                                                type="submit"
                                            >
                                                <i className="bi bi-search"></i>
                                            </button>
                                        </div>
                                    </form>

                                    <div className="mt-4">
                                        {loading && (
                                            <div className="text-center">
                                                <div className="spinner-border text-primary" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                            </div>
                                        )}

                                        {!loading && searchQuery && (
                                            <div className="search-results">
                                                {renderResults()}
                                                {searchResults.length === 0 && (
                                                    <div className="text-center text-muted">
                                                        Δεν βρέθηκαν αποτελέσματα
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Search;
