// src/scripts/verify-api.ts
import fetch from 'node-fetch';

const baseUrl = 'http://localhost:3000';
const types = ['EMAIL', 'SMS', 'CALL'];

async function verifyApi() {
  for (const type of types) {
    const url = `${baseUrl}/api/communications?type=${type}&limit=10&page=1&source=HUMAN`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`API response for type ${type}:`, JSON.stringify(data, null, 2));
      
      // Check if data has the expected structure
      if (!data.success || !Array.isArray(data.data)) {
        console.warn(`Unexpected API response structure for type ${type}:`, data);
      } else {
        console.log(`API response for type ${type} looks good!`);
      }
    } catch (error) {
      console.error(`Error fetching data for type ${type}:`, error);
    }
    
    console.log('---');
  }
}

verifyApi();