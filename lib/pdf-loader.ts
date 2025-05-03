import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import pdfParse from 'pdf-parse';

// In Node.js environment, use require for pdf-parse
const require = createRequire(import.meta.url);

export async function loadPdfDocument(filePath: string): Promise<string> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Error loading PDF document:', error);
    throw error;
  }
}

export async function loadAllPdfsFromDirectory(dirPath: string): Promise<{[key: string]: string}> {
  const pdfContents: {[key: string]: string} = {};
  
  try {
    const files = fs.readdirSync(dirPath);
    const pdfFiles = files.filter(file => path.extname(file).toLowerCase() === '.pdf');
    
    for (const file of pdfFiles) {
      const filePath = path.join(dirPath, file);
      const content = await loadPdfDocument(filePath);
      pdfContents[file] = content;
    }
    
    return pdfContents;
  } catch (error) {
    console.error('Error loading PDFs from directory:', error);
    throw error;
  }
}