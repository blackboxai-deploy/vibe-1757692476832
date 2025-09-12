import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: 'Salesforce CRM Analytics Assistant',
  description: 'Create, fix, build and enhance Salesforce CRM Analytics recipe and dataflow assets',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="flex min-h-screen">
          {/* Sidebar Navigation */}
          <aside className="w-64 bg-white border-r border-gray-200 shadow-sm">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-8">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SF</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">CRM Analytics</h1>
                  <p className="text-xs text-gray-500">Assistant</p>
                </div>
              </div>
              
              <nav className="space-y-2">
                <Link href="/" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                  <div className="w-5 h-5 bg-gray-400 rounded"></div>
                  <span className="font-medium">Dashboard</span>
                </Link>
                
                <Link href="/upload" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                  <div className="w-5 h-5 bg-gray-400 rounded"></div>
                  <span className="font-medium">Upload Asset</span>
                </Link>
                
                <Link href="/fix" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                  <div className="w-5 h-5 bg-gray-400 rounded"></div>
                  <span className="font-medium">AutoFix Engine</span>
                </Link>
                
                <Link href="/wizard" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                  <div className="w-5 h-5 bg-gray-400 rounded"></div>
                  <span className="font-medium">Enhancement Wizard</span>
                </Link>
                
                <Link href="/create" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                  <div className="w-5 h-5 bg-gray-400 rounded"></div>
                  <span className="font-medium">Create Recipe</span>
                </Link>
                
                <Link href="/saql-builder" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                  <div className="w-5 h-5 bg-gray-400 rounded"></div>
                  <span className="font-medium">SAQL Builder</span>
                </Link>
              </nav>
              
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Quick Help</h3>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Start by uploading your JSON asset or creating a new recipe from SAQL queries and data samples.
                </p>
              </div>
            </div>
          </aside>
          
          {/* Main Content */}
          <main className="flex-1 flex flex-col">
            <header className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Salesforce CRM Analytics Assistant</h2>
                  <p className="text-sm text-gray-600">Create, fix, build and enhance your analytics assets</p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Connected
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"></div>
                </div>
              </div>
            </header>
            
            <div className="flex-1 p-6">
              {children}
            </div>
          </main>
        </div>
        
        <Toaster position="top-right" />
      </body>
    </html>
  );
}