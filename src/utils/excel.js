import * as XLSX from 'xlsx';

export const exportToExcel = (data, filename) => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};

export const parseExcelData = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error("No file provided."));
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        resolve(json);
      } catch (error) {
        console.error('Error parsing Excel data:', error);
        reject(new Error("Could not parse the file. Make sure it's a valid Excel or CSV file."));
      }
    };
    reader.onerror = (error) => reject(new Error("Error reading file."));
    reader.readAsArrayBuffer(file);
  });
};