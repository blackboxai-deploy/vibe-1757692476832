'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Salesforce CRM Analytics Assistant
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Create, fix, build and enhance your Salesforce CRM Analytics recipe and dataflow assets with intelligent automation, validation, and optimization tools.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/upload">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Upload Asset
            </Button>
          </Link>
          <Link href="/create">
            <Button size="lg" variant="outline">
              Create New Recipe
            </Button>
          </Link>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">AutoFix Engine</CardTitle>
              <Badge variant="secondary">Automated</Badge>
            </div>
            <CardDescription>
              Automatically detect and fix common Salesforce format issues, field requirements, and JSON formatting problems.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600 mb-4">
              <li>• Date attribute optimization</li>
              <li>• Deprecated function replacement</li>
              <li>• Field requirement validation</li>
              <li>• JSON structure correction</li>
            </ul>
            <Link href="/fix">
              <Button className="w-full">Try AutoFix</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Enhancement Wizard</CardTitle>
              <Badge variant="outline">Interactive</Badge>
            </div>
            <CardDescription>
              Step-by-step guided process to enhance your assets with contextual recommendations and best practices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600 mb-4">
              <li>• Issue prioritization</li>
              <li>• Visual change preview</li>
              <li>• Detailed explanations</li>
              <li>• Multiple export options</li>
            </ul>
            <Link href="/wizard">
              <Button className="w-full" variant="outline">Start Wizard</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">SAQL Builder</CardTitle>
              <Badge variant="default">Advanced</Badge>
            </div>
            <CardDescription>
              Interactive SAQL query builder with real-time validation, function documentation, and performance optimization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600 mb-4">
              <li>• Real-time validation</li>
              <li>• Function reference</li>
              <li>• Performance analysis</li>
              <li>• Template generation</li>
            </ul>
            <Link href="/saql-builder">
              <Button className="w-full" variant="outline">Build SAQL</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recipe Creator</CardTitle>
              <Badge variant="secondary">Smart</Badge>
            </div>
            <CardDescription>
              Convert SAQL queries and data samples into optimized recipes with automated best practice recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600 mb-4">
              <li>• SAQL to recipe conversion</li>
              <li>• Data sample analysis</li>
              <li>• Optimization suggestions</li>
              <li>• Template library</li>
            </ul>
            <Link href="/create">
              <Button className="w-full" variant="outline">Create Recipe</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Asset Upload</CardTitle>
              <Badge variant="outline">Essential</Badge>
            </div>
            <CardDescription>
              Upload or paste your JSON assets with optional schema validation and immediate compatibility checking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600 mb-4">
              <li>• Multiple upload methods</li>
              <li>• Schema validation</li>
              <li>• Format detection</li>
              <li>• Immediate feedback</li>
            </ul>
            <Link href="/upload">
              <Button className="w-full" variant="outline">Upload Asset</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-blue-900">Quick Start</CardTitle>
              <Badge className="bg-blue-600">Recommended</Badge>
            </div>
            <CardDescription className="text-blue-700">
              New to the platform? Start here for a guided introduction to all features and capabilities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-blue-800">
                <strong>Workflow:</strong>
              </div>
              <ol className="space-y-1 text-sm text-blue-700 list-decimal list-inside">
                <li>Upload your JSON asset</li>
                <li>Run AutoFix for common issues</li>
                <li>Use Wizard for manual enhancements</li>
                <li>Export optimized asset</li>
              </ol>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 mt-4">
                Get Started
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Features Section */}
      <div className="bg-white rounded-lg border p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Salesforce-Specific Optimizations
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Validations</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <span>Strict JSON formatting and field requirements</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <span>Date attribute optimization for Data Prep Settings</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <span>Multivalue field handling with Summer '22 functions</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <span>Self-referential ComputeRelative conversion</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Modern Function Support</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <span>Replace deprecated SAQL operators and functions</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <span>Date arithmetic with interval functions</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <span>Modern multivalue operations (split, array_join, etc.)</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <span>Performance optimization recommendations</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}