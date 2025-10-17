import {
  TextractClient,
  AnalyzeDocumentCommand,
  DetectDocumentTextCommand,
  AnalyzeIDCommand,
  AnalyzeExpenseCommand
} from '@aws-sdk/client-textract';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const textract = new TextractClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1'
});

export interface ExtractedText {
  text: string;
  confidence: number;
  type: 'LINE' | 'WORD' | 'TABLE' | 'FORM';
}

export interface IDDocument {
  type: 'PASSPORT' | 'DRIVERS_LICENSE' | 'ID_CARD';
  fields: Record<string, string>;
  isValid: boolean;
}

/**
 * Extract text from image (ID verification, receipts, etc)
 */
export async function extractText(
  imageBuffer: Buffer,
  documentType: 'DOCUMENT' | 'ID' | 'EXPENSE' = 'DOCUMENT'
): Promise<ExtractedText[]> {
  try {
    const command = new DetectDocumentTextCommand({
      Document: {
        Bytes: imageBuffer
      }
    });

    const response = await textract.send(command);
    const results: ExtractedText[] = [];

    // Process blocks
    for (const block of response.Blocks || []) {
      if (block.BlockType === 'LINE' && block.Text) {
        results.push({
          text: block.Text,
          confidence: block.Confidence || 0,
          type: 'LINE'
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Textract text extraction error:', error);
    throw error;
  }
}

/**
 * Analyze ID documents for verification
 */
export async function analyzeIDDocument(imageBuffer: Buffer): Promise<IDDocument> {
  try {
    const command = new AnalyzeIDCommand({
      DocumentPages: [{
        Bytes: imageBuffer
      }]
    });

    const response = await textract.send(command);
    const document = response.IdentityDocuments?.[0];
    
    if (!document) {
      throw new Error('No ID document detected');
    }

    const fields: Record<string, string> = {};
    
    // Extract normalized fields
    for (const field of document.IdentityDocumentFields || []) {
      if (field.Type?.Text && field.ValueDetection?.Text) {
        fields[field.Type.Text] = field.ValueDetection.Text;
      }
    }

    // Determine document type
    let docType: IDDocument['type'] = 'ID_CARD';
    if (fields['PASSPORT']) {
      docType = 'PASSPORT';
    } else if (fields['DRIVERS_LICENSE']) {
      docType = 'DRIVERS_LICENSE';
    }

    return {
      type: docType,
      fields,
      isValid: validateIDDocument(fields)
    };
  } catch (error) {
    console.error('Textract ID analysis error:', error);
    throw error;
  }
}

/**
 * Extract data from receipts/invoices
 */
export async function analyzeExpense(imageBuffer: Buffer) {
  try {
    const command = new AnalyzeExpenseCommand({
      Document: {
        Bytes: imageBuffer
      }
    });

    const response = await textract.send(command);
    const summary = response.ExpenseDocuments?.[0]?.SummaryFields || [];
    
    const expense: Record<string, any> = {};
    
    for (const field of summary) {
      if (field.Type?.Text && field.ValueDetection?.Text) {
        expense[field.Type.Text] = field.ValueDetection.Text;
      }
    }

    return {
      vendor: expense.VENDOR_NAME || 'Unknown',
      total: parseFloat(expense.TOTAL || '0'),
      date: expense.INVOICE_RECEIPT_DATE || new Date().toISOString(),
      items: extractLineItems(response.ExpenseDocuments?.[0])
    };
  } catch (error) {
    console.error('Textract expense analysis error:', error);
    throw error;
  }
}

/**
 * Extract forms and tables from documents
 */
export async function analyzeDocument(imageBuffer: Buffer) {
  try {
    const command = new AnalyzeDocumentCommand({
      Document: {
        Bytes: imageBuffer
      },
      FeatureTypes: ['TABLES', 'FORMS']
    });

    const response = await textract.send(command);
    
    return {
      tables: extractTables(response.Blocks || []),
      forms: extractFormFields(response.Blocks || [])
    };
  } catch (error) {
    console.error('Textract document analysis error:', error);
    throw error;
  }
}

/**
 * Process uploaded document from S3
 */
export async function processS3Document(
  bucket: string,
  key: string,
  documentType: 'DOCUMENT' | 'ID' | 'EXPENSE' = 'DOCUMENT'
) {
  const params = {
    Document: {
      S3Object: {
        Bucket: bucket,
        Name: key
      }
    }
  };

  switch (documentType) {
    case 'ID':
      return textract.send(new AnalyzeIDCommand({
        DocumentPages: [params.Document]
      }));
    case 'EXPENSE':
      return textract.send(new AnalyzeExpenseCommand(params));
    default:
      return textract.send(new DetectDocumentTextCommand(params));
  }
}

/**
 * Validate ID document fields
 */
function validateIDDocument(fields: Record<string, string>): boolean {
  // Basic validation rules
  const requiredFields = ['FIRST_NAME', 'LAST_NAME', 'DATE_OF_BIRTH'];
  const hasRequired = requiredFields.every(field => fields[field]);
  
  // Check if person is 18+
  if (fields.DATE_OF_BIRTH) {
    const dob = new Date(fields.DATE_OF_BIRTH);
    const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    return hasRequired && age >= 18;
  }
  
  return hasRequired;
}

/**
 * Extract tables from document blocks
 */
function extractTables(blocks: any[]): any[] {
  const tables = [];
  const tableBlocks = blocks.filter(b => b.BlockType === 'TABLE');
  
  // Implementation would parse table cells and relationships
  // This is simplified for brevity
  
  return tables;
}

/**
 * Extract form fields from document blocks
 */
function extractFormFields(blocks: any[]): Record<string, string> {
  const forms: Record<string, string> = {};
  const kvBlocks = blocks.filter(b => b.BlockType === 'KEY_VALUE_SET');
  
  // Implementation would parse key-value relationships
  // This is simplified for brevity
  
  return forms;
}

/**
 * Extract line items from expense document
 */
function extractLineItems(expenseDoc: any): any[] {
  if (!expenseDoc?.LineItemGroups) return [];
  
  const items = [];
  for (const group of expenseDoc.LineItemGroups) {
    for (const lineItem of group.LineItems || []) {
      const item: any = {};
      for (const field of lineItem.LineItemExpenseFields || []) {
        if (field.Type?.Text && field.ValueDetection?.Text) {
          item[field.Type.Text] = field.ValueDetection.Text;
        }
      }
      items.push(item);
    }
  }
  
  return items;
}

/**
 * OCR for creator verification documents
 */
export async function verifyCreatorDocuments(documents: {
  id: Buffer;
  taxForm?: Buffer;
  proofOfAddress?: Buffer;
}) {
  const results = await Promise.all([
    analyzeIDDocument(documents.id),
    documents.taxForm ? extractText(documents.taxForm) : null,
    documents.proofOfAddress ? extractText(documents.proofOfAddress) : null
  ]);
  
  return {
    idVerification: results[0],
    taxFormExtracted: results[1],
    addressExtracted: results[2],
    isVerified: results[0].isValid && !!results[2]
  };
}