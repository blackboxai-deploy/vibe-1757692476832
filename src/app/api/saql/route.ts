import { NextRequest, NextResponse } from 'next/server';
import { SAQLParser } from '@/lib/salesforce/saql-parser';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { saqlQuery, action = 'validate' } = body;

    if (!saqlQuery && action !== 'template') {
      return NextResponse.json(
        { error: 'SAQL query is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'validate':
        const validationResult = SAQLParser.validateSAQL(saqlQuery);
        return NextResponse.json({
          success: true,
          validation: validationResult
        });

      case 'format':
        const formattedQuery = SAQLParser.formatSAQL(saqlQuery);
        return NextResponse.json({
          success: true,
          formatted: formattedQuery
        });

      case 'analyze':
        const datasets = SAQLParser.extractDatasets(saqlQuery);
        const fields = SAQLParser.extractFields(saqlQuery);
        const validation = SAQLParser.validateSAQL(saqlQuery);
        
        return NextResponse.json({
          success: true,
          analysis: {
            datasets,
            fields,
            validation,
            complexity: {
              datasets: datasets.length,
              fields: fields.length,
              errors: validation.errors.length,
              warnings: validation.warnings.length
            }
          }
        });

      case 'template':
        const { templateType = 'basic' } = body;
        const template = SAQLParser.generateSAQLTemplate(templateType as any);
        return NextResponse.json({
          success: true,
          template
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: validate, format, analyze, template' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('SAQL API error:', error);
    
    return NextResponse.json(
      { 
        error: 'SAQL processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Salesforce CRM Analytics SAQL API',
    endpoints: {
      POST: '/api/saql - Process SAQL queries'
    },
    actions: {
      validate: 'Validate SAQL syntax and functions',
      format: 'Format and beautify SAQL query',
      analyze: 'Extract datasets, fields, and complexity analysis',
      template: 'Generate SAQL templates (basic, join, aggregate, compute)'
    },
    supportedFunctions: [
      'sum', 'count', 'avg', 'min', 'max',
      'coalesce', 'case', 'when', 'then', 'else',
      'startsWith', 'endsWith', 'contains',
      'split', 'array_join', 'array_contains', 'size', 'array',
      'Year', 'Month', 'Day', 'Hour', 'Minute', 'Second',
      'Row_Number', 'Rank', 'Dense_Rank'
    ],
    deprecatedWarnings: [
      'like operator → use startsWith/endsWith/contains',
      'date_diff function → use interval arithmetic',
      'date part references → use date functions',
      'epoch operations → use datetime arithmetic'
    ]
  });
}