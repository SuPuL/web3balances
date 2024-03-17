require('dotenv').config();

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const bearerToken = process.env.BLOCKPIT_BEARER;
const folderPath = process.env.NEXT_PUBLIC_BLOCKPIT_CSV_FOLDER;

const years = [
  2021,
  2022,
  2023,
  2024,
  2025,
];

async function downloadCSV(url, bearerToken, fileName) {
  try {
      // Make GET request with Authorization header containing the bearer token
      const response = await axios.get(url, {
          headers: {
              Authorization: `Bearer ${bearerToken}`
          }
      });

      
      const filePath = path.join(folderPath, fileName);

      // Write CSV data to file
      fs.writeFileSync(filePath, response.data);

      console.log(`Data successfully fetched and saved as CSV to ${filePath}`);
  } catch (error) {
      console.error('Error:', error.response ? error.response.data : error.message);
  }
}


// Main function to combine CSV files
async function downloadAll() {
  for (const year of years) {
    console.info(`Processing ${year}`)
    downloadCSV(`https://cn.blockpit.io/api/v1/transactions/export?year=${year}`, bearerToken, `Transactions_${year}.csv`);
  }

  console.log(`All files downloaded to ${folderPath}`);
}

downloadAll().catch((error) => {
  console.error('Error:', error);
});
