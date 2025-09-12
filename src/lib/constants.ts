// Salesforce CRM Analytics Constants and Rules

export const SALESFORCE_FIELD_TYPES = {
  TEXT: 'Text',
  NUMBER: 'Numeric',
  DATE: 'Date',
  DATETIME: 'DateTime',
  BOOLEAN: 'Boolean',
  MULTIVALUE: 'Text'
} as const;

export const SUPPORTED_SAQL_FUNCTIONS = [
  'sum', 'count', 'avg', 'min', 'max',
  'coalesce', 'case', 'when', 'then', 'else',
  'startsWith', 'endsWith', 'contains',
  'split', 'array_join', 'array_contains', 'size', 'array',
  'Year', 'Month', 'Day', 'Hour', 'Minute', 'Second',
  'Row_Number', 'Rank', 'Dense_Rank'
] as const;

export const DEPRECATED_SAQL_FUNCTIONS = {
  'like': 'Use startsWith, endsWith, or contains instead',
  'date_diff': 'Use interval arithmetic (DateTimeField + interval X hours)',
  'isMultiValue': 'Use new multivalue functions (split, array_join, etc.)',
  'multiValueSeparator': 'Use new multivalue functions'
} as const;

export const DATE_ATTRIBUTES = {
  fiscalMonthOffset: 'Define as Date Attribute in Data Prep Settings',
  firstDayOfWeek: 'Define as Date Attribute in Data Prep Settings',
  fiscalYearStartMonth: 'Define as Date Attribute in Data Prep Settings'
} as const;

export const REQUIRED_RECIPE_FIELDS = [
  'version',
  'nodes',
  'ui'
] as const;

export const REQUIRED_DATAFLOW_FIELDS = [
  'version',
  'nodes'
] as const;

export const FIELD_ATTRIBUTES = {
  precision: 'Override using Edit Attribute transform in recipes',
  scale: 'Override using Edit Attribute transform in recipes',
  format: 'Override using Edit Attribute transform in recipes'
} as const;

export const SAQL_TO_RECIPE_MAPPINGS = {
  // Date part references mapping
  '_Year': 'Year(field)',
  '_Month': 'Month(field)',
  '_Day': 'Day(field)',
  '_Hour': 'Hour(field)',
  '_Minute': 'Minute(field)',
  '_Second': 'Second(field)',
  '_Quarter': 'Quarter(field)',
  '_Week': 'Week(field)'
} as const;

export const COMMON_FIXES = {
  MISSING_VERSION: 'Add version field to asset',
  INVALID_JSON: 'Fix JSON formatting and structure',
  MISSING_REQUIRED_FIELDS: 'Add required fields for asset type',
  DEPRECATED_FUNCTIONS: 'Replace deprecated SAQL functions',
  DATE_ATTRIBUTE_ISSUES: 'Move date attributes to Data Prep Settings',
  SELF_REFERENTIAL_COMPUTE: 'Replace with aggregate or join operations',
  UNSUPPORTED_OPERATORS: 'Replace unsupported SAQL operators',
  FIELD_ATTRIBUTE_ISSUES: 'Use Edit Attribute transform for field attributes'
} as const;

export const ASSET_TYPES = {
  RECIPE: 'recipe',
  DATAFLOW: 'dataflow',
  LENS: 'lens',
  DASHBOARD: 'dashboard'
} as const;

export const VALIDATION_RULES = {
  RECIPE: {
    requiredFields: ['version', 'nodes', 'ui'],
    optionalFields: ['label', 'description', 'createdBy', 'createdDate'],
    nodeTypes: ['csvDigest', 'sfdcDigest', 'filter', 'aggregate', 'computeExpression', 'augment', 'join']
  },
  DATAFLOW: {
    requiredFields: ['version', 'nodes'],
    optionalFields: ['label', 'description', 'createdBy', 'createdDate'],
    nodeTypes: ['csvDigest', 'sfdcDigest', 'filter', 'aggregate', 'computeExpression', 'augment', 'join', 'sfdcRegister']
  }
} as const;

export const MULTIVALUE_FUNCTIONS = {
  split: {
    description: 'Returns a multivalue from a delimited string',
    syntax: 'split(field, separator)',
    example: 'split(Categories, ";")'
  },
  array_join: {
    description: 'Returns a delimited string from a multivalue',
    syntax: 'array_join(multivalue_field, separator)',
    example: 'array_join(Skills, ", ")'
  },
  array_contains: {
    description: 'Returns true if the multivalue contains the specified string',
    syntax: 'array_contains(multivalue_field, value)',
    example: 'array_contains(Categories, "Technology")'
  },
  size: {
    description: 'Returns number of elements in a multivalue',
    syntax: 'size(multivalue_field)',
    example: 'size(Skills)'
  },
  array: {
    description: 'Returns a multivalue consisting of the input parameters',
    syntax: 'array(value1, value2, ...)',
    example: 'array("A", "B", "C")'
  }
} as const;

export const DATE_DIFF_REPLACEMENT = {
  description: 'Replace SAQL date_diff with interval arithmetic',
  examples: {
    daysBetween: 'EndDate - StartDate',
    hoursBetween: '(EndDateTime - StartDateTime) / interval 1 hours',
    minutesBetween: '(EndDateTime - StartDateTime) / interval 1 minutes'
  }
} as const;