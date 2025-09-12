import { SUPPORTED_SAQL_FUNCTIONS, DEPRECATED_SAQL_FUNCTIONS } from '../constants';

export interface SAQLValidationResult {
  isValid: boolean;
  errors: SAQLError[];
  warnings: SAQLWarning[];
  suggestions: string[];
}

export interface SAQLError {
  message: string;
  line?: number;
  column?: number;
  type: 'syntax' | 'function' | 'reference';
}

export interface SAQLWarning {
  message: string;
  line?: number;
  column?: number;
  type: 'deprecated' | 'performance' | 'best-practice';
}

export class SAQLParser {
  
  static validateSAQL(saqlQuery: string): SAQLValidationResult {
    const errors: SAQLError[] = [];
    const warnings: SAQLWarning[] = [];
    const suggestions: string[] = [];
    
    try {
      // Basic syntax validation
      this.validateBasicSyntax(saqlQuery, errors);
      
      // Function validation
      this.validateFunctions(saqlQuery, errors, warnings);
      
      // Check for deprecated patterns
      this.checkDeprecatedPatterns(saqlQuery, warnings, suggestions);
      
      // Check for performance issues
      this.checkPerformanceIssues(saqlQuery, warnings, suggestions);
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions
      };
      
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          message: `SAQL parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'syntax'
        }],
        warnings: [],
        suggestions: []
      };
    }
  }
  
  private static validateBasicSyntax(saql: string, errors: SAQLError[]) {
    // Check for balanced parentheses
    const openParens = (saql.match(/\(/g) || []).length;
    const closeParens = (saql.match(/\)/g) || []).length;
    
    if (openParens !== closeParens) {
      errors.push({
        message: 'Unbalanced parentheses in SAQL query',
        type: 'syntax'
      });
    }
    
    // Check for basic SAQL structure
    if (!saql.trim().toLowerCase().includes('q =') && !saql.trim().toLowerCase().startsWith('q=')) {
      if (!saql.includes('=')) {
        errors.push({
          message: 'SAQL query must start with variable assignment (e.g., q = load ...)',
          type: 'syntax'
        });
      }
    }
    
    // Check for common syntax errors
    const commonErrors = [
      { pattern: /\s+,/, message: 'Extra whitespace before comma' },
      { pattern: /,\s*[)}\]]/, message: 'Trailing comma before closing bracket' },
      { pattern: /[({[]\s*,/, message: 'Leading comma after opening bracket' }
    ];
    
    commonErrors.forEach(({ pattern, message }) => {
      if (pattern.test(saql)) {
        errors.push({
          message,
          type: 'syntax'
        });
      }
    });
  }
  
  private static validateFunctions(saql: string, errors: SAQLError[], warnings: SAQLWarning[]) {
    // Extract function calls
    const functionPattern = /(\w+)\s*\(/g;
    let match;
    
    while ((match = functionPattern.exec(saql)) !== null) {
      const functionName = match[1];
      
      // Check if function is supported
      if (!SUPPORTED_SAQL_FUNCTIONS.includes(functionName as any)) {
        // Check if it's deprecated
        if (Object.keys(DEPRECATED_SAQL_FUNCTIONS).includes(functionName)) {
          warnings.push({
            message: `Deprecated function '${functionName}': ${DEPRECATED_SAQL_FUNCTIONS[functionName as keyof typeof DEPRECATED_SAQL_FUNCTIONS]}`,
            type: 'deprecated'
          });
        } else {
          errors.push({
            message: `Unknown or unsupported function: ${functionName}`,
            type: 'function'
          });
        }
      }
    }
  }
  
  private static checkDeprecatedPatterns(saql: string, warnings: SAQLWarning[], suggestions: string[]) {
    // Check for 'like' operator
    if (/\s+like\s+/i.test(saql)) {
      warnings.push({
        message: 'SAQL "like" operator is not supported',
        type: 'deprecated'
      });
      suggestions.push('Use startsWith(), endsWith(), or contains() functions instead of "like"');
    }
    
    // Check for date part references
    if (/_(?:Year|Month|Day|Hour|Minute|Second|Quarter|Week)/i.test(saql)) {
      warnings.push({
        message: 'Date part references (e.g., CreatedDate_Month) are not supported',
        type: 'deprecated'
      });
      suggestions.push('Use date functions like Year(), Month(), Day() instead of field_DatePart references');
    }
    
    // Check for date_diff
    if (/date_diff\s*\(/i.test(saql)) {
      warnings.push({
        message: 'date_diff function will be available in Winter \'23',
        type: 'deprecated'
      });
      suggestions.push('Use interval arithmetic: (EndDateTime - StartDateTime) / interval 1 hours');
    }
    
    // Check for epoch date operations
    if (/toDate|sec_epoch|day_epoch/i.test(saql)) {
      warnings.push({
        message: 'Epoch date operations detected',
        type: 'best-practice'
      });
      suggestions.push('Consider using simple date/datetime arithmetic with interval functions');
    }
  }
  
  private static checkPerformanceIssues(saql: string, warnings: SAQLWarning[], suggestions: string[]) {
    // Check for nested subqueries
    const subqueryCount = (saql.match(/\(\s*q\s*=\s*load/gi) || []).length;
    if (subqueryCount > 3) {
      warnings.push({
        message: 'Multiple nested subqueries detected - may impact performance',
        type: 'performance'
      });
      suggestions.push('Consider breaking complex queries into multiple steps or using joins');
    }
    
    // Check for cartesian joins
    if (/join\s+by/i.test(saql) && !/on\s+/i.test(saql)) {
      warnings.push({
        message: 'Potential cartesian join detected',
        type: 'performance'
      });
      suggestions.push('Ensure joins have proper ON conditions to avoid cartesian products');
    }
    
    // Check for expensive operations in group by
    if (/group\s+by.*case\s+when/i.test(saql)) {
      warnings.push({
        message: 'Complex expressions in GROUP BY may impact performance',
        type: 'performance'
      });
      suggestions.push('Consider pre-computing complex expressions in a separate step');
    }
  }
  
  static formatSAQL(saql: string): string {
    return saql
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\s*=\s*/g, ' = ') // Space around equals
      .replace(/\s*,\s*/g, ', ') // Space after commas
      .replace(/\s*\(\s*/g, '(') // No space after opening paren
      .replace(/\s*\)\s*/g, ')') // No space before closing paren
      .replace(/\s*(;)\s*/g, '$1\n') // New line after semicolons
      .trim();
  }
  
  static extractDatasets(saql: string): string[] {
    const datasets: string[] = [];
    const loadPattern = /load\s+"([^"]+)"/gi;
    let match;
    
    while ((match = loadPattern.exec(saql)) !== null) {
      datasets.push(match[1]);
    }
    
    return [...new Set(datasets)]; // Remove duplicates
  }
  
  static extractFields(saql: string): string[] {
    const fields: string[] = [];
    
    // Extract fields from foreach clauses
    const foreachPattern = /foreach\s+([^{]+)\s*{/gi;
    let match;
    
    while ((match = foreachPattern.exec(saql)) !== null) {
      const fieldList = match[1];
      const individualFields = fieldList.split(',').map(f => f.trim().replace(/['"]/g, ''));
      fields.push(...individualFields);
    }
    
    return [...new Set(fields)].filter(f => f.length > 0);
  }
  
  static generateSAQLTemplate(type: 'basic' | 'join' | 'aggregate' | 'compute'): string {
    const templates = {
      basic: `q = load "dataset_name";
q = foreach q generate column1, column2, column3;`,
      
      join: `q1 = load "dataset1";
q2 = load "dataset2";
q = join q1 by 'id' right q2 by 'id';`,
      
      aggregate: `q = load "dataset_name";
q = group q by 'dimension';
q = foreach q generate 'dimension', sum('measure') as 'total';`,
      
      compute: `q = load "dataset_name";
q = foreach q generate *, 
    case when 'amount' > 1000 then "High" else "Low" end as 'category';`
    };
    
    return templates[type] || templates.basic;
  }
}