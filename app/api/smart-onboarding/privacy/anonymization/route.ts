import { NextRequest, NextResponse } from 'next/server';
import { dataPrivacyService } from '../../../../../lib/smart-onboarding/services/dataPrivacyService';
import { logger } from '../../../../../lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const { data, userId, dataType } = await request.json();
    
    if (!data || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: data, userId' },
        { status: 400 }
      );
    }

    // Anonymize the data
    const result = await dataPrivacyService.anonymizeUserData(data, userId);

    logger.info('Data anonymized', { userId, dataType });

    return NextResponse.json({
      success: true,
      anonymizedData: result.anonymizedData,
      timestamp: result.timestamp,
      // Don't return the anonymization map for security
      mapSize: Object.keys(result.anonymizationMap).length
    });

  } catch (error) {
    logger.error('Failed to anonymize data', { error });
    return NextResponse.json(
      { error: 'Failed to anonymize data' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'test') {
      // Test anonymization with sample data
      const sampleData = {
        email: 'user@example.com',
        phone: '+1234567890',
        name: 'John Doe',
        address: '123 Main St, City, State',
        socialMedia: {
          twitter: 'https://twitter.com/johndoe',
          linkedin: 'https://linkedin.com/in/johndoe'
        },
        behaviorData: {
          mouseMovements: [
            { x: 100, y: 200, timestamp: Date.now() },
            { x: 150, y: 250, timestamp: Date.now() + 1000 }
          ],
          clickPatterns: ['button_click', 'link_click'],
          sessionDuration: 300
        }
      };

      const result = await dataPrivacyService.anonymizeUserData(sampleData, 'test-user-123');

      return NextResponse.json({
        success: true,
        original: sampleData,
        anonymized: result.anonymizedData,
        mappingCount: Object.keys(result.anonymizationMap).length
      });
    }

    if (action === 'validate') {
      // Validate anonymization quality
      const testData = request.nextUrl.searchParams.get('data');
      if (!testData) {
        return NextResponse.json(
          { error: 'Missing test data' },
          { status: 400 }
        );
      }

      try {
        const parsedData = JSON.parse(testData);
        const validation = validateAnonymization(parsedData);
        
        return NextResponse.json({
          success: true,
          validation
        });
      } catch (parseError) {
        return NextResponse.json(
          { error: 'Invalid JSON data' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Invalid action. Use ?action=test or ?action=validate' },
      { status: 400 }
    );

  } catch (error) {
    logger.error('Failed to process anonymization request', { error });
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

function validateAnonymization(data: any): {
  score: number;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // Check for potential PII leakage
  const piiPatterns = [
    { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, type: 'email' },
    { pattern: /\b\d{3}-\d{2}-\d{4}\b/, type: 'SSN' },
    { pattern: /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, type: 'credit card' },
    { pattern: /\b\+?[\d\s\-\(\)]{10,}\b/, type: 'phone number' }
  ];

  function checkValue(value: any, path: string): void {
    if (typeof value === 'string') {
      for (const { pattern, type } of piiPatterns) {
        if (pattern.test(value)) {
          issues.push(`Potential ${type} found at ${path}: ${value.substring(0, 10)}...`);
          score -= 20;
        }
      }
      
      // Check for non-anonymized names
      if (/\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(value)) {
        issues.push(`Potential full name found at ${path}`);
        score -= 15;
      }
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => checkValue(item, `${path}[${index}]`));
    } else if (value && typeof value === 'object') {
      for (const [key, val] of Object.entries(value)) {
        checkValue(val, `${path}.${key}`);
      }
    }
  }

  checkValue(data, 'root');

  // Generate recommendations
  if (issues.length > 0) {
    recommendations.push('Review and improve anonymization for detected PII');
  }
  
  if (score < 80) {
    recommendations.push('Consider using stronger anonymization techniques');
  }
  
  if (score === 100) {
    recommendations.push('Anonymization appears to be effective');
  }

  return {
    score: Math.max(0, score),
    issues,
    recommendations
  };
}