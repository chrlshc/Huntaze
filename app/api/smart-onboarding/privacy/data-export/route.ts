import { NextRequest, NextResponse } from 'next/server';
import { dataPrivacyService } from '../../../../../lib/smart-onboarding/services/dataPrivacyService';
import { logger } from '../../../../../lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const { userId, format = 'json' } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    // Validate format
    const validFormats = ['json', 'csv', 'xml'];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: `Invalid format. Must be one of: ${validFormats.join(', ')}` },
        { status: 400 }
      );
    }

    // Export user data
    const userData = await dataPrivacyService.exportUserData(userId);
    
    // Format the data based on requested format
    let formattedData: string;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'json':
        formattedData = JSON.stringify(userData, null, 2);
        contentType = 'application/json';
        filename = `user-data-${userId}.json`;
        break;
      case 'csv':
        formattedData = convertToCSV(userData);
        contentType = 'text/csv';
        filename = `user-data-${userId}.csv`;
        break;
      case 'xml':
        formattedData = convertToXML(userData);
        contentType = 'application/xml';
        filename = `user-data-${userId}.xml`;
        break;
      default:
        throw new Error('Unsupported format');
    }

    logger.info('User data exported', { userId, format });

    // Return the data as a downloadable file
    return new NextResponse(formattedData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': Buffer.byteLength(formattedData).toString()
      }
    });

  } catch (error) {
    logger.error('Failed to export user data', error instanceof Error ? error : new Error(String(error)), {});
    return NextResponse.json(
      { error: 'Failed to export user data' },
      { status: 500 }
    );
  }
}

function convertToCSV(data: any): string {
  const rows: string[] = [];
  
  // Add header
  rows.push('Section,Key,Value,Type');
  
  // Flatten the data structure
  function flattenObject(obj: any, prefix = ''): void {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        flattenObject(value, fullKey);
      } else {
        const csvValue = Array.isArray(value) ? JSON.stringify(value) : String(value);
        const escapedValue = csvValue.includes(',') ? `"${csvValue.replace(/"/g, '""')}"` : csvValue;
        rows.push(`${prefix || 'root'},${key},${escapedValue},${typeof value}`);
      }
    }
  }
  
  flattenObject(data);
  return rows.join('\n');
}

function convertToXML(data: any): string {
  function objectToXML(obj: any, rootName = 'data'): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n`;
    
    function addElement(key: string, value: any, indent = '  '): string {
      if (value === null || value === undefined) {
        return `${indent}<${key} />\n`;
      }
      
      if (Array.isArray(value)) {
        let result = `${indent}<${key}>\n`;
        value.forEach((item, index) => {
          result += addElement(`item_${index}`, item, indent + '  ');
        });
        result += `${indent}</${key}>\n`;
        return result;
      }
      
      if (typeof value === 'object') {
        let result = `${indent}<${key}>\n`;
        for (const [subKey, subValue] of Object.entries(value)) {
          result += addElement(subKey, subValue, indent + '  ');
        }
        result += `${indent}</${key}>\n`;
        return result;
      }
      
      const escapedValue = String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
      
      return `${indent}<${key}>${escapedValue}</${key}>\n`;
    }
    
    for (const [key, value] of Object.entries(obj)) {
      xml += addElement(key, value);
    }
    
    xml += `</${rootName}>`;
    return xml;
  }
  
  return objectToXML(data, 'userData');
}