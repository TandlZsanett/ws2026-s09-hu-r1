//json-server --watch database.json --port 3000
//node server.js

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 5000;

// JSON Server URL
const JSON_SERVER_URL = 'http://localhost:3000/customers';

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to fetch data from JSON Server
async function fetchCustomers() {
    try {
        const response = await axios.get(JSON_SERVER_URL);
        console.log('Customers data from JSON Server:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching customers from JSON Server:', error);
        return [];
    }
}

// Endpoint: Overview Metrics
app.get('/api/overview', async (req, res) => {
    try {
        const customers = await fetchCustomers();
        console.log('Customers in /api/overview:', customers); 

        if (!customers || customers.length === 0) {
            return res.status(404).json({ error: 'No customers found' });
        }

        const totalCustomers = customers.length;
        const totalSpending = customers.reduce((sum, customer) => sum + (customer.totalSpending|| 0), 0);
        const averageAge = customers.reduce((sum, customer) => sum + (customer.age || 0), 0) / totalCustomers;
        const averageOrderValue = totalSpending / customers.reduce((sum, customer) => sum + (customer.frequency || 0), 0);
        const purchaseFrequency = customers.reduce((sum, customer) => sum + (customer.frequency || 0), 0) / totalCustomers;
        console.log('Overview metrics:', { totalCustomers, totalSpending, averageAge, averageOrderValue, purchaseFrequency });
        // Most frequent purchase category
        const categoryCounts = {};
        customers.forEach(customer => {
            const category = customer.preferredCategory;
            if (category) {
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            }
        });
        const mostFrequentCategory = Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b, 'N/A');

        res.json({
            totalCustomers,
            averageAge: Math.round(averageAge),
            mostFrequentCategory,
            totalSpending,
            averageOrderValue: Math.round(averageOrderValue),
            purchaseFrequency: Math.round(purchaseFrequency),
        });
    } catch (error) {
        console.error('Error in /api/overview:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Endpoint: Demographics
app.get('/api/demographics', async (req, res) => {
    const customers = await fetchCustomers();

    const genderDistribution = { M: 0, F: 0 };
    const membershipDistribution = { bronze: 0, silver: 0, gold: 0 };

    customers.forEach(customer => {
        if (customer.gender === 'M' || customer.gender === 'F') {
            genderDistribution[customer.gender]++;
        }
        if (customer.membership) {
            membershipDistribution[customer.membership]++;
        }
    });

    res.json({ genderDistribution, membershipDistribution });
});

// Endpoint: Purchase Behavior
app.get('/api/purchase-behavior', async (req, res) => {
    const customers = await fetchCustomers();

    // Most purchased categories
    const categoryCounts = {};
    customers.forEach(customer => {
        const category = customer.preferredCategory;
        if (category) {
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        }
    });

    // Top 10 spenders
    const topSpenders = customers
        .sort((a, b) => b.totalSpending - a.totalSpending)
        .slice(0, 10)
        .map(customer => ({
            name: `${customer.firstName} ${customer.lastName}`,
            totalSpending: customer.totalSpending,
        }));

    res.json({ categoryCounts, topSpenders });
});

// Endpoint: Trends Over Time
app.get('/api/trends', async (req, res) => {
    const customers = await fetchCustomers();

    // New customers per year
    const yearlyTrends = {};
    customers.forEach(customer => {
        const year = customer.joinedAt.split('-')[0];
        yearlyTrends[year] = (yearlyTrends[year] || 0) + 1;
    });

    res.json({ yearlyTrends });
});






async function fetchCustomers() {
    const response = await axios.get(JSON_SERVER_URL);
    return response.data;
}

// Endpoint: Customer List with Search, Filter, Sort, and Pagination
app.get('/api/customers', async (req, res) => {
    const { search, filter, sort, page = 1, pageSize = 25 } = req.query;
    const customers = await fetchCustomers();
    console.log('Fetching customers...');

    console.log('Customers:', customers);
    // Filter customers based on search term
    let filteredCustomers = customers;
    if (search) {
        const searchTerm = search.toLowerCase();
        filteredCustomers = filteredCustomers.filter(customer =>
            customer.firstName.toLowerCase().includes(searchTerm) ||
            customer.lastName.toLowerCase().includes(searchTerm) ||
            customer.email.toLowerCase().includes(searchTerm)
        );
    }

    // Apply additional filters (e.g., membership level)
    if (filter) {
        filteredCustomers = filteredCustomers.filter(customer =>
            customer.membership === filter
        );
    }

    // Sort customers
    if (sort) {
        const [field, order] = sort.split(':');
        filteredCustomers.sort((a, b) => {
            if (a[field] < b[field]) return order === 'asc' ? -1 : 1;
            if (a[field] > b[field]) return order === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // Paginate results
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + parseInt(pageSize);
    const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

    res.json({
        totalCustomers: filteredCustomers.length,
        customers: paginatedCustomers,
    });
});
app.get('/', (req, res) => {
    res.send('Üdvözöllek az Express szerveren!');
});
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});