import { 
  VALIDATION_RULES, 
  ASSET_TYPES, 
  DEPRECATED_SAQL_FUNCTIONS,
  COMMON_FIXES 
} from '../constants';

export interface ValidationIssue {
  type: keyof typeof COMMON_FIXES;
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: string;
  suggestion: string;
  autoFixable: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  assetType: string | null;
  fixableIssues: ValidationIssue[];
  manualIssues: ValidationIssue[];
}

export class SalesforceValidator {
  
  static validateAsset(jsonData: any): ValidationResult {
    const issues: ValidationIssue[] = [];
    
    try {
      // Basic JSON structure validation
      if (!jsonData || typeof jsonData !== 'object') {
        return {
          isValid: false,
          issues: [{
            type: 'INVALID_JSON',
            severity: 'error',
            message: 'Invalid JSON structure',
            suggestion: 'Ensure the asset is valid JSON format',
            autoFixable: false
          }],
          assetType: null,
          fixableIssues: [],
          manualIssues: []
        };
      }

      // Detect asset type
      const assetType = this.detectAssetType(jsonData);
      
      // Validate required fields
      this.validateRequiredFields(jsonData, assetType, issues);
      
      // Validate nodes if present
      if (jsonData.nodes) {
        this.validateNodes(jsonData.nodes, issues);
      }
      
      // Check for deprecated SAQL functions
      this.checkDeprecatedFunctions(jsonData, issues);
      
      // Validate field attributes
      this.validateFieldAttributes(jsonData, issues);
      
      // Check date attributes
      this.validateDateAttributes(jsonData, issues);
      
      // Separate fixable and manual issues
      const fixableIssues = issues.filter(issue => issue.autoFixable);
      const manualIssues = issues.filter(issue => !issue.autoFixable);
      
      return {
        isValid: issues.filter(issue => issue.severity === 'error').length === 0,
        issues,
        assetType,
        fixableIssues,
        manualIssues
      };
      
    } catch (error) {
      return {
        isValid: false,
        issues: [{
          type: 'INVALID_JSON',
          severity: 'error',
          message: `JSON parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          suggestion: 'Check JSON syntax and structure',
          autoFixable: false
        }],
        assetType: null,
        fixableIssues: [],
        manualIssues: []
      };
    }
  }
  
  private static detectAssetType(jsonData: any): string {
    if (jsonData.ui && jsonData.nodes) {
      return ASSET_TYPES.RECIPE;
    } else if (jsonData.nodes && !jsonData.ui) {
      return ASSET_TYPES.DATAFLOW;
    } else if (jsonData.type === 'lens' || jsonData.visualizationType) {
      return ASSET_TYPES.LENS;
    } else if (jsonData.type === 'dashboard' || jsonData.widgets) {
      return ASSET_TYPES.DASHBOARD;
    }
    return 'unknown';
  }
  
  private static validateRequiredFields(jsonData: any, assetType: string, issues: ValidationIssue[]) {
    const rules = assetType === ASSET_TYPES.RECIPE 
      ? VALIDATION_RULES.RECIPE 
      : VALIDATION_RULES.DATAFLOW;
    
    if (!rules) return;
    
    rules.requiredFields.forEach(field => {
      if (!jsonData.hasOwnProperty(field)) {
        issues.push({
          type: 'MISSING_REQUIRED_FIELDS',
          severity: 'error',
          message: `Missing required field: ${field}`,
          location: `root.${field}`,
          suggestion: `Add the ${field} field to your ${assetType}`,
          autoFixable: field === 'version'
        });
      }
    });
  }
  
  private static validateNodes(nodes: any, issues: ValidationIssue[]) {
    if (!Array.isArray(nodes) && typeof nodes !== 'object') {
      issues.push({
        type: 'INVALID_JSON',
        severity: 'error',
        message: 'Nodes must be an array or object',
        location: 'nodes',
        suggestion: 'Ensure nodes is properly structured',
        autoFixable: false
      });
      return;
    }
    
    const nodeList = Array.isArray(nodes) ? nodes : Object.values(nodes);
    
    nodeList.forEach((node: any, index: number) => {
      if (!node.action) {
        issues.push({
          type: 'MISSING_REQUIRED_FIELDS',
          severity: 'error',
          message: `Node ${index} missing action field`,
          location: `nodes[${index}].action`,
          suggestion: 'Add action field to specify node type',
          autoFixable: false
        });
      }
      
      // Check for self-referential computeRelative
      if (node.action === 'computeRelative' && node.saqlExpression) {
        const outputColumn = node.parameters?.left || node.left;
        if (outputColumn && node.saqlExpression.includes(outputColumn)) {
          issues.push({
            type: 'SELF_REFERENTIAL_COMPUTE',
            severity: 'warning',
            message: `Self-referential computeRelative detected in node ${index}`,
            location: `nodes[${index}].saqlExpression`,
            suggestion: 'Replace with aggregate, join, or Row_Number function',
            autoFixable: false
          });
        }
      }
    });
  }
  
  private static checkDeprecatedFunctions(jsonData: any, issues: ValidationIssue[]) {
    const jsonString = JSON.stringify(jsonData);
    
    Object.entries(DEPRECATED_SAQL_FUNCTIONS).forEach(([func, replacement]) => {
      if (jsonString.includes(func)) {
        issues.push({
          type: 'DEPRECATED_FUNCTIONS',
          severity: 'warning',
          message: `Deprecated function '${func}' found`,
          suggestion: replacement,
          autoFixable: func === 'like'
        });
      }
    });
  }
  
  private static validateFieldAttributes(jsonData: any, issues: ValidationIssue[]) {
    const jsonString = JSON.stringify(jsonData);
    
    if (jsonString.includes('precision') || jsonString.includes('scale')) {
      issues.push({
        type: 'FIELD_ATTRIBUTE_ISSUES',
        severity: 'info',
        message: 'Field attributes like precision/scale detected',
        suggestion: 'Use Edit Attribute transform in recipes to override these',
        autoFixable: false
      });
    }
    
    if (jsonString.includes('defaultValue') && jsonString.includes('(')) {
      issues.push({
        type: 'DEPRECATED_FUNCTIONS',
        severity: 'warning',
        message: 'SAQL functions in defaultValue parameters not supported',
        suggestion: 'Use coalesce function or case statement in Custom Formula',
        autoFixable: false
      });
    }
  }
  
  private static validateDateAttributes(jsonData: any, issues: ValidationIssue[]) {
    const jsonString = JSON.stringify(jsonData);
    
    const dateAttribs = ['fiscalMonthOffset', 'firstDayOfWeek', 'fiscalYearStartMonth'];
    
    dateAttribs.forEach(attr => {
      if (jsonString.includes(attr)) {
        issues.push({
          type: 'DATE_ATTRIBUTE_ISSUES',
          severity: 'info',
          message: `Date attribute '${attr}' should be defined in Data Prep Settings`,
          suggestion: 'Move date attributes to Data Prep Settings for automatic application',
          autoFixable: true
        });
      }
    });
    
    // Check for date part references
    const datePartPattern = /_(?:Year|Month|Day|Hour|Minute|Second|Quarter|Week)/g;
    const matches = jsonString.match(datePartPattern);
    
    if (matches) {
      issues.push({
        type: 'DEPRECATED_FUNCTIONS',
        severity: 'warning',
        message: 'Date part references found (e.g., CreatedDate_Month)',
        suggestion: 'Use corresponding functions like Year(), Month(), etc.',
        autoFixable: true
      });
    }
  }
  
  static validateSchema(schema: any, data: any): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    if (!schema || !data) {
      return issues;
    }
    
    try {
      // Basic schema validation logic
      if (schema.fields && Array.isArray(schema.fields)) {
        schema.fields.forEach((field: any) => {
          if (field.required && !data.hasOwnProperty(field.name)) {
            issues.push({
              type: 'MISSING_REQUIRED_FIELDS',
              severity: 'error',
              message: `Required field '${field.name}' missing from data`,
              location: String(field.name),
              suggestion: `Add ${field.name} field to match schema requirements`,
              autoFixable: false
            });
          }
        });
      }
    } catch (error) {
      issues.push({
        type: 'INVALID_JSON',
        severity: 'error',
        message: 'Schema validation error',
        suggestion: 'Check schema format and structure',
        autoFixable: false
      });
    }
    
    return issues;
  }
}