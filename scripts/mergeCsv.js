require('dotenv').config();

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const folderPath = process.env.NEXT_PUBLIC_BLOCKPIT_CSV_FOLDER;
const resultFileName = process.env.NEXT_PUBLIC_BLOCKPIT_CSV_DST_FILE;

const outputFilePath = path.join(__dirname, resultFileName);

const files = fs.readdirSync(folderPath);

// Function to process each CSV file
function processCSV(filePath) {
  return new Promise((resolve, reject) => {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    Papa.parse(fileContent, {
      header: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

// Main function to combine CSV files
async function mergeCSVFiles() {
  let combinedRecords = [];
  
  for (const file of files) {
    console.info(`Processing ${file}`)
    const filePath = path.join(folderPath, file);
    const records = await processCSV(filePath);
    combinedRecords = combinedRecords.concat(records);
  }

  const csv = Papa.unparse(combinedRecords);
  fs.writeFileSync(outputFilePath, csv);

  console.log(`Combined CSV files saved to ${outputFilePath}`);
}

mergeCSVFiles().catch((error) => {
  console.error('Error:', error);
});
