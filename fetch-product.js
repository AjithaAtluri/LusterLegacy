// Simple script to fetch product 26
import fetch from 'node-fetch';

const fetchProduct = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/products/26');
    const product = await response.json();
    console.log(JSON.stringify(product, null, 2));
  } catch (error) {
    console.error('Error fetching product:', error);
  }
};

fetchProduct();