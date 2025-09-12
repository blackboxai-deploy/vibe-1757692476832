import { NextRequest, NextResponse } from 'next/server';
import { SalesforceValidator } from '@/lib/salesforce/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { asset, schema } = body;

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset is required' },
        { status: 400 }
      );
    }

    // Validate the asset
    const validationResult = SalesforceValidator.validateAsset(asset);

    // If schema is provided, add schema validation
    if (schema) {
      const schemaIssues = SalesforceValidator.validateSchema(schema, asset);
      validationResult.issues.push(...schemaIssues);
      validationResult.fixableIssues.push(...schemaIssues.filter(issue => issue.autoFixable));
      validationResult.manualIssues.push(...schemaIssues.filter(issue => !issue.autoFixable));
      
      // Update isValid flag if schema validation found errors
      if (schemaIssues.some(issue => issue.severity === 'error')) {
        validationResult.isValid = false;
      }
    }

    return NextResponse.json({
      success: true,
      validation: validationResult
    });

  } catch (error) {
    console.error('Validation API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Validation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Salesforce CRM Analytics Validation API',
    endpoints: {
      POST: '/api/validate - Validate asset with optional schema'
    },
    supportedAssetTypes: ['recipe', 'dataflow', 'lens', 'dashboard'],
    features: [
      'Field requirement validation',
      'JSON structure validation',
      'Deprecated function detection', 
      'Date attribute validation',
      'Schema compliance checking'
    ]
  });
}