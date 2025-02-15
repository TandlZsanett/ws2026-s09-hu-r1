import React, { useEffect, useState } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import axios from 'axios';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

import CustomerList from './CustomerList';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

function App() {
    const [overview, setOverview] = useState(null);
    const [demographics, setDemographics] = useState(null);
    const [purchaseBehavior, setPurchaseBehavior] = useState(null);
    const [trends, setTrends] = useState(null);

    useEffect(() => {
        // Fetch overview metrics
        axios.get('http://localhost:5000/api/overview')
        .then(response => {
            console.log('Overview API Response:', response.data);
            setOverview({
                ...response.data,
                averageAge: parseFloat(response.data.averageAge),
                averageOrderValue: parseFloat(response.data.averageOrderValue),
                purchaseFrequency: parseFloat(response.data.purchaseFrequency),
            });
        })
        .catch(error => {
            console.error('Error fetching overview data:', error);
        });


        // Fetch demographics
        axios.get('http://localhost:5000/api/demographics').then(response => {
            setDemographics(response.data);
        });

        // Fetch purchase behavior
        axios.get('http://localhost:5000/api/purchase-behavior').then(response => {
            setPurchaseBehavior(response.data);
        });

        // Fetch trends
        axios.get('http://localhost:5000/api/trends').then(response => {
            setTrends(response.data);
        });
    }, []);

    if (!overview || !demographics || !purchaseBehavior || !trends) {
        return <div>Loading...</div>;
    }

    return (
        <div className="App">

            <h1>Customer Dashboard</h1>
            <CustomerList />
            <h2>Overview Metrics</h2>
            <div>
                <p>Total Customers: {overview.totalCustomers}</p>
                <p>Average Age: {overview.averageAge}</p>
                <p>Most Frequent Category: {overview.mostFrequentCategory}</p>
                <p>Total Spending: ${overview.totalSpending}</p>
                <p>Average Order Value: ${overview.averageOrderValue}</p>
                <p>Purchase Frequency: {overview.purchaseFrequency} per year</p>
            </div>

            <h2>Demographics</h2>
            <div>
                <h3>Gender Distribution</h3>
                <Pie
                    data={{
                        labels: ['Male', 'Female'],
                        datasets: [
                            {
                                data: [demographics.genderDistribution.M, demographics.genderDistribution.F],
                                backgroundColor: ['#36A2EB', '#FF6384'],
                            },
                        ],
                    }}
                />

                <h3>Membership Distribution</h3>
                <Pie
                    data={{
                        labels: ['Bronze', 'Silver', 'Gold'],
                        datasets: [
                            {
                                data: [
                                    demographics.membershipDistribution.bronze,
                                    demographics.membershipDistribution.silver,
                                    demographics.membershipDistribution.gold,
                                ],
                                backgroundColor: ['#FFCE56', '#4BC0C0', '#9966FF'],
                            },
                        ],
                    }}
                />
            </div>

            <h2>Purchase Behavior</h2>
            <div>
                <h3>Most Purchased Categories</h3>
                <Bar
                    data={{
                        labels: Object.keys(purchaseBehavior.categoryCounts),
                        datasets: [
                            {
                                label: 'Purchases',
                                data: Object.values(purchaseBehavior.categoryCounts),
                                backgroundColor: '#36A2EB',
                            },
                        ],
                    }}
                />

                <h3>Top 10 Spenders</h3>
                <ul>
                    {purchaseBehavior.topSpenders.map((spender, index) => (
                        <li key={index}>
                            {spender.name}: ${spender.totalSpending}
                        </li>
                    ))}
                </ul>
            </div>

            <h2>Trends Over Time</h2>
            <div>
                <Line
                    data={{
                        labels: Object.keys(trends.yearlyTrends),
                        datasets: [
                            {
                                label: 'New Customers',
                                data: Object.values(trends.yearlyTrends),
                                borderColor: '#FF6384',
                                fill: false,
                            },
                        ],
                    }}
                />
            </div>
        </div>
    );
}

export default App;