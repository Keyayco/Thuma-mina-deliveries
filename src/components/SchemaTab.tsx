import React, { useState } from 'react';
import { TABLES_SCHEMA, TableSchema } from '../data/initialData';
import { Database, Key, Shield, Copy, Check, Info } from 'lucide-react';

export const SchemaTab: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<TableSchema>(TABLES_SCHEMA[0]);
  const [copied, setCopied] = useState(false);

  const generateSQL = (table: TableSchema) => {
    return `-- Table definition for ${table.name}
CREATE TABLE ${table.name} (
${table.fields.map(f => {
  let line = `  ${f.name.padEnd(24)} ${f.type}`;
  if (f.isPrimary) line += ' PRIMARY KEY';
  if (f.references) line += ` REFERENCES ${f.references}`;
  if (f.isNullable === false && !f.isPrimary) line += ' NOT NULL';
  if (f.defaultVal) line += ` DEFAULT ${f.defaultVal}`;
  return line;
}).join(',\n')}
);

-- Enable Row Level Security
ALTER TABLE ${table.name} ENABLE ROW LEVEL SECURITY;
`;
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(generateSQL(selectedTable));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 p-6 md:p-8 flex flex-col lg:flex-row gap-6 overflow-hidden">
      {/* Table Selector Sidebar */}
      <div className="w-full lg:w-72 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col shrink-0">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#FF6321]" />
            <span className="font-bold text-xs uppercase tracking-wider text-slate-800">Relational Tables</span>
          </div>
          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
            {TABLES_SCHEMA.length}
          </span>
        </div>

        <div className="space-y-1 overflow-y-auto flex-1 pr-1">
          {TABLES_SCHEMA.map(table => {
            const isSelected = selectedTable.name === table.name;
            return (
              <button
                key={table.name}
                onClick={() => setSelectedTable(table)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-mono transition-colors flex items-center justify-between ${
                  isSelected 
                    ? 'bg-slate-100 text-[#FF6321] font-bold border border-slate-200' 
                    : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <span>{table.name}</span>
                {table.ruleTag && (
                  <span className="text-[9px] bg-slate-200/60 text-slate-600 px-1 py-0.2 rounded font-sans font-medium">
                    {table.ruleTag}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
          Normalized for Supabase PostgreSQL with strict RLS policies.
        </div>
      </div>

      {/* Table Details */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-mono text-base font-bold text-slate-900">{selectedTable.name}</h2>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                RLS ENABLED
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{selectedTable.description}</p>
          </div>

          <button
            onClick={handleCopySQL}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied SQL' : 'Copy DDL'}</span>
          </button>
        </div>

        {/* Fields Table */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Table Columns & Constraints
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2.5 px-4">Column Name</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Default / Constraint</th>
                  <th className="py-2.5 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {selectedTable.fields.map(field => (
                  <tr key={field.name} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-bold text-slate-800 flex items-center gap-1.5">
                      {field.isPrimary && <Key className="w-3 h-3 text-[#FF6321] shrink-0" />}
                      <span>{field.name}</span>
                    </td>
                    <td className="py-2.5 px-4 text-blue-600 font-semibold">{field.type}</td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {field.isPrimary && <span className="text-amber-600 font-sans font-medium">PRIMARY KEY</span>}
                      {field.references && <span className="text-purple-600 font-sans font-medium ml-1">FK → {field.references}</span>}
                      {field.defaultVal && <span className="text-slate-400 ml-1">DEFAULT {field.defaultVal}</span>}
                      {!field.isPrimary && !field.references && !field.defaultVal && '-'}
                    </td>
                    <td className="py-2.5 px-4 font-sans text-slate-600 text-xs">{field.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* RLS Policies */}
          <div className="mt-6">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Row Level Security (RLS) Policies</span>
            </div>

            <div className="space-y-2">
              {selectedTable.policies.map((p, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 uppercase tracking-wide bg-slate-200 px-1.5 py-0.5 rounded text-[10px]">
                      {p.role}
                    </span>
                    <span className="font-mono text-[#FF6321] font-bold text-[11px]">
                      {p.action}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-600 bg-white px-2.5 py-1 rounded border border-slate-200">
                    USING ({p.rule})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
