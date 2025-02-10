import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CustomerList() {
    const [customers, setCustomers] = useState([]);
    const [totalCustomers, setTotalCustomers] = useState(0);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('');
    const [sort, setSort] = useState('');
    const [page, setPage] = useState(1);
    const [error, setError] = useState(null);
    const pageSize = 25;

    useEffect(() => {
        fetchCustomers();
    }, [search, filter, sort, page]);

    const fetchCustomers = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/customers', {
                params: { search, filter, sort, page, pageSize },
            });
            setCustomers(response.data.customers);
            setTotalCustomers(response.data.totalCustomers);
            
        } catch (err) {
            console.error('Error fetching customers:', err);
            setError('Failed to fetch customers. Please try again later.');
        }
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1); 
    };

    const handleFilter = (e) => {
        setFilter(e.target.value);
        setPage(1); 
    };

    const handleSort = (e) => {
        setSort(e.target.value);
        setPage(1); 
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    return (
        <div>
            <h2>Customer List</h2>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <div>
                <input
                    type="text"
                    placeholder="Search by name or email"
                    value={search}
                    onChange={handleSearch}
                />
                <select value={filter} onChange={handleFilter}>
                    <option value="">All Memberships</option>
                    <option value="bronze">Bronze</option>
                    <option value="silver">Silver</option>
                    <option value="gold">Gold</option>
                </select>
                <select value={sort} onChange={handleSort}>
                    <option value="">Sort By</option>
                    <option value="firstName:asc">First Name (A-Z)</option>
                    <option value="firstName:desc">First Name (Z-A)</option>
                    <option value="lastName:asc">Last Name (A-Z)</option>
                    <option value="lastName:desc">Last Name (Z-A)</option>
                    <option value="totalSpending:asc">Total Spending (Low to High)</option>
                    <option value="totalSpending:desc">Total Spending (High to Low)</option>
                </select>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Membership</th>
                        <th>Total Spending</th>
                    </tr>
                </thead>
                <tbody>
                    {customers.map((customer) => (
                        <tr key={customer.id}>
                            <td>{customer.firstName}</td>
                            <td>{customer.lastName}</td>
                            <td>{customer.email}</td>
                            <td>{customer.phone}</td>
                            <td>{customer.membership}</td>
                            <td>${customer.totalSpending}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div>
                <button
                    disabled={page === 1}
                    onClick={() => handlePageChange(page - 1)}
                >
                    Previous
                </button>
                <span>Page {page}</span>
                <button
                    disabled={page * pageSize >= totalCustomers}
                    onClick={() => handlePageChange(page + 1)}
                >
                    Next
                </button>
            </div>
        </div>
    );
}

export default CustomerList;