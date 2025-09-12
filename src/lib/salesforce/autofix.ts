import { ValidationIssue } from './validation';
import { 
  SAQL_TO_RECIPE_MAPPINGS
} from '../constants';

export interface FixResult {
  success: boolean;
  originalAsset: any;
  fixedAsset: any;
  appliedFixes: string[];
  remainingIssues: ValidationIssue[];
  changeLog: ChangeLogEntry[];
}

export interface ChangeLogEntry {
  type: string;
  description: string;
  location: string;
  before: string;
  after: string;
  reasoning: string;
}

export class AutoFixEngine {
  
  static applyFixes(asset: any, issues: ValidationIssue[]): FixResult {
    const originalAsset = JSON.parse(JSON.stringify(asset));
    let fixedAsset = JSON.parse(JSON.stringify(asset));
    const appliedFixes: string[] = [];
    const changeLog: ChangeLogEntry[] = [];
    const remainingIssues: ValidationIssue[] = [];
    
    issues.forEach(issue => {
      if (issue.autoFixable) {
        const result = this.applyFix(fixedAsset, issue, changeLog);
        if (result.success) {
          fixedAsset = result.asset;
          appliedFixes.push(issue.type);
        } else {
          remainingIssues.push(issue);
        }
      } else {
        remainingIssues.push(issue);
      }
    });
    
    return {
      success: appliedFixes.length > 0,
      originalAsset,
      fixedAsset,
      appliedFixes,
      remainingIssues,
      changeLog
    };
  }
  
  private static applyFix(asset: any, issue: ValidationIssue, changeLog: ChangeLogEntry[]): { success: boolean; asset: any } {
    switch (issue.type) {
      case 'MISSING_VERSION':
        return this.addVersion(asset, changeLog);
        
      case 'DEPRECATED_FUNCTIONS':
        return this.replaceDeprecatedFunctions(asset, changeLog);
        
      case 'DATE_ATTRIBUTE_ISSUES':
        return this.fixDateAttributes(asset, changeLog);
        
      case 'UNSUPPORTED_OPERATORS':
        return this.replaceUnsupportedOperators(asset, changeLog);
        
      default:
        return { success: false, asset };
    }
  }
  
  private static addVersion(asset: any, changeLog: ChangeLogEntry[]): { success: boolean; asset: any } {
    if (!asset.version) {
      const before = 'Missing version field';
      const after = '"version": "58.0"';
      
      asset.version = "58.0";
      
      changeLog.push({
        type: 'VERSION_ADDED',
        description: 'Added missing version field',
        location: 'root.version',
        before,
        after,
        reasoning: 'Version field is required for all Salesforce CRM Analytics assets'
      });
      
      return { success: true, asset };
    }
    
    return { success: false, asset };
  }
  
  private static replaceDeprecatedFunctions(asset: any, changeLog: ChangeLogEntry[]): { success: boolean; asset: any } {
    const assetString = JSON.stringify(asset);
    let modified = false;
    let newAssetString = assetString;
    
    // Replace 'like' operator with 'contains'
    const likePattern = /(\w+)\s+like\s+['"](.*?)['"](?!\w)/gi;
    const likeMatches = assetString.match(likePattern);
    
    if (likeMatches) {
      likeMatches.forEach(match => {
        const containsReplacement = match.replace(/like/i, 'contains');
        newAssetString = newAssetString.replace(match, containsReplacement);
        
        changeLog.push({
          type: 'DEPRECATED_FUNCTION_REPLACED',
          description: 'Replaced deprecated "like" operator with "contains"',
          location: 'SAQL expression',
          before: match,
          after: containsReplacement,
          reasoning: 'SAQL "like" operator is not supported; use contains, startsWith, or endsWith'
        });
        
        modified = true;
      });
    }
    
    // Replace date part references
    Object.entries(SAQL_TO_RECIPE_MAPPINGS).forEach(([oldRef, newFunc]) => {
      const pattern = new RegExp(`(\\w+)${oldRef.replace('_', '_')}`, 'g');
      const matches = newAssetString.match(pattern);
      
      if (matches) {
        matches.forEach(match => {
          const fieldName = match.replace(oldRef, '');
          const replacement = String(newFunc).replace('field', fieldName);
          newAssetString = newAssetString.replace(match, replacement);
          
          changeLog.push({
            type: 'DATE_PART_REFERENCE_UPDATED',
            description: `Updated date part reference`,
            location: 'SAQL expression',
            before: match,
            after: replacement,
            reasoning: `Date part references like ${oldRef} are not supported; use ${String(newFunc)} function instead`
          });
          
          modified = true;
        });
      }
    });
    
    if (modified) {
      try {
        const parsedAsset = JSON.parse(newAssetString);
        return { success: true, asset: parsedAsset };
      } catch {
        return { success: false, asset };
      }
    }
    
    return { success: false, asset };
  }
  
  private static fixDateAttributes(asset: any, changeLog: ChangeLogEntry[]): { success: boolean; asset: any } {
    const assetString = JSON.stringify(asset);
    let modified = false;
    
    // Remove date attributes that should be in Data Prep Settings
    const dateAttribs = ['fiscalMonthOffset', 'firstDayOfWeek', 'fiscalYearStartMonth'];
    
    dateAttribs.forEach(attr => {
      if (assetString.includes(`"${attr}"`)) {
        // Find and remove the attribute
        const regex = new RegExp(`,?\\s*"${attr}"\\s*:\\s*[^,}]+`, 'g');
        const newAssetString = assetString.replace(regex, '');
        
        if (newAssetString !== assetString) {
          changeLog.push({
            type: 'DATE_ATTRIBUTE_MOVED',
            description: `Removed ${attr} from asset`,
            location: `fields.${attr}`,
            before: `"${attr}": [value]`,
            after: 'Removed',
            reasoning: `${attr} should be defined as Date Attribute in Data Prep Settings for automatic application to all date fields`
          });
          
          modified = true;
        }
      }
    });
    
    if (modified) {
      try {
        const parsedAsset = JSON.parse(assetString.replace(/,\s*}/g, '}').replace(/{\s*,/g, '{'));
        return { success: true, asset: parsedAsset };
      } catch {
        return { success: false, asset };
      }
    }
    
    return { success: false, asset };
  }
  
  private static replaceUnsupportedOperators(asset: any, changeLog: ChangeLogEntry[]): { success: boolean; asset: any } {
    const assetString = JSON.stringify(asset);
    let newAssetString = assetString;
    let modified = false;
    
    // Replace startsWith patterns
    const startsWithPattern = /(\w+)\s+like\s+['"]([^%]+)%['"]/gi;
    const startsWithMatches = assetString.match(startsWithPattern);
    
    if (startsWithMatches) {
      startsWithMatches.forEach(match => {
        const replacement = match.replace(/like\s+['"]([^%]+)%['"]/, 'startsWith("$1")');
        newAssetString = newAssetString.replace(match, replacement);
        
        changeLog.push({
          type: 'OPERATOR_MODERNIZED',
          description: 'Replaced like pattern with startsWith function',
          location: 'SAQL expression',
          before: match,
          after: replacement,
          reasoning: 'Use startsWith function instead of like with % wildcard for better performance'
        });
        
        modified = true;
      });
    }
    
    // Replace endsWith patterns
    const endsWithPattern = /(\w+)\s+like\s+['"]%([^%]+)['"]/gi;
    const endsWithMatches = assetString.match(endsWithPattern);
    
    if (endsWithMatches) {
      endsWithMatches.forEach(match => {
        const replacement = match.replace(/like\s+['"]%([^%]+)['"]/, 'endsWith("$1")');
        newAssetString = newAssetString.replace(match, replacement);
        
        changeLog.push({
          type: 'OPERATOR_MODERNIZED',
          description: 'Replaced like pattern with endsWith function',
          location: 'SAQL expression',
          before: match,
          after: replacement,
          reasoning: 'Use endsWith function instead of like with % wildcard for better performance'
        });
        
        modified = true;
      });
    }
    
    if (modified) {
      try {
        const parsedAsset = JSON.parse(newAssetString);
        return { success: true, asset: parsedAsset };
      } catch {
        return { success: false, asset };
      }
    }
    
    return { success: false, asset };
  }
  
  static generateSuggestions(issues: ValidationIssue[]): string[] {
    const suggestions: string[] = [];
    
    issues.forEach(issue => {
      switch (issue.type) {
        case 'SELF_REFERENTIAL_COMPUTE':
          suggestions.push('Consider using aggregate node for data grouping operations');
          suggestions.push('Use Join node with Lookup (MultiValue) for text concatenation');
          suggestions.push('Use Row_Number function instead of computeRelative for row numbers');
          break;
          
        case 'DEPRECATED_FUNCTIONS':
          if (issue.message.includes('date_diff')) {
            suggestions.push('Use interval arithmetic: (EndDateTime - StartDateTime) / interval 1 hours');
            suggestions.push('For date differences: EndDate - StartDate');
          }
          if (issue.message.includes('isMultiValue')) {
            suggestions.push('Use new multivalue functions: split, array_join, array_contains, size, array');
          }
          break;
          
        case 'FIELD_ATTRIBUTE_ISSUES':
          suggestions.push('Use Edit Attribute transform to override precision and scale');
          suggestions.push('Apply field format changes through recipe transforms');
          break;
          
        default:
          suggestions.push(issue.suggestion);
      }
    });
    
    return [...new Set(suggestions)]; // Remove duplicates
  }
}