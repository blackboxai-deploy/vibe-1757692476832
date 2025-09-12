import { NextRequest, NextResponse } from 'next/server';
import { SalesforceValidator } from '@/lib/salesforce/validation';
import { AutoFixEngine } from '@/lib/salesforce/autofix';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { asset } = body;

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset is required' },
        { status: 400 }
      );
    }

    // First validate the asset to identify issues
    const validationResult = SalesforceValidator.validateAsset(asset);
    
    // Apply AutoFix to fixable issues
    const fixResult = AutoFixEngine.applyFixes(asset, validationResult.fixableIssues);
    
    // Generate additional suggestions for remaining issues
    const suggestions = AutoFixEngine.generateSuggestions(fixResult.remainingIssues);

    return NextResponse.json({
      success: true,
      fixResult: {
        ...fixResult,
        suggestions
      },
      originalValidation: validationResult,
      options: {
        autoApplied: fixResult.appliedFixes.length,
        manualReviewRequired: fixResult.remainingIssues.length,
        totalChanges: fixResult.changeLog.length
      }
    });

  } catch (error) {
    console.error('AutoFix API error:', error);
    
    return NextResponse.json(
      { 
        error: 'AutoFix processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Salesforce CRM Analytics AutoFix API',
    endpoints: {
      POST: '/api/autofix - Apply automatic fixes to asset'
    },
    supportedFixes: [
      'Missing version fields',
      'Deprecated SAQL operators (like → contains/startsWith/endsWith)', 
      'Date part references (field_Month → Month(field))',
      'Date attributes (move to Data Prep Settings)',
      'JSON formatting and structure'
    ],
    manualReviewRequired: [
      'Self-referential computeRelative operations',
      'Multivalue field conversions',
      'Field precision/scale attributes',
      'Custom date_diff implementations',
      'Complex SAQL expressions'
    ],
    options: {
      dryRun: 'boolean - Preview changes without applying',
      aggressive: 'boolean - Apply more aggressive optimizations',
      preserveComments: 'boolean - Maintain JSON comments if present'
    }
  });
}