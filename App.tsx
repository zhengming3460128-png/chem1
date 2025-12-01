import React, { useState, useCallback } from 'react';
import { generateMoleculeData } from './services/gemini';
import { MoleculeData } from './types';
import LewisStructure from './components/LewisStructure';
import Molecule3D from './components/Molecule3D';
import { 
  Atom, 
  Orbit, 
  Search, 
  Loader2, 
  Info, 
  Maximize2,
  Zap,
  Box,
  Layers
} from 'lucide-react';

const App: React.FC = () => {
  const [formula, setFormula] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MoleculeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // View options
  const [showLonePairs, setShowLonePairs] = useState(true);
  const [showCharges, setShowCharges] = useState(true);
  const [showLabels3D, setShowLabels3D] = useState(true);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formula.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const result = await generateMoleculeData(formula.trim());
      setData(result);
    } catch (err) {
      setError("Failed to generate molecule. Please check the formula or try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Atom size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">MoleculeGenius AI</h1>
          </div>
          
          <div className="hidden md:flex items-center text-sm text-slate-500 gap-4">
            <span className="flex items-center gap-1"><Zap size={14} /> Gemini 2.5 Flash Powered</span>
            <span className="flex items-center gap-1"><Box size={14} /> 3D VSEPR</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Search / Input Section */}
        <div className="max-w-2xl mx-auto mb-12 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
            Visualize Chemistry Instantly
          </h2>
          <p className="text-slate-600 mb-8">
            Enter a chemical formula (e.g., <button onClick={() => { setFormula("H2O"); }} className="text-indigo-600 hover:underline font-mono">H2O</button>, <button onClick={() => { setFormula("C6H6"); }} className="text-indigo-600 hover:underline font-mono">C6H6</button>, <button onClick={() => { setFormula("SF6"); }} className="text-indigo-600 hover:underline font-mono">SF6</button>) to generate its Lewis structure and interactive 3D geometry.
          </p>

          <form onSubmit={handleGenerate} className="relative flex items-center">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={20} />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-32 py-4 bg-white border border-slate-200 rounded-xl text-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Enter formula (e.g. CO2)"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : "Visualize"}
              </button>
            </div>
          </form>
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        {data && (
          <div className="animate-fade-in-up space-y-6">
            
            {/* Molecule Header Info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 font-mono mb-1">{data.formula}</h2>
                <h3 className="text-lg text-slate-600 font-medium">{data.name}</h3>
              </div>
              <div className="flex gap-2 flex-wrap">
                 <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100">
                  {data.molecularGeometry}
                 </span>
                 <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium border border-emerald-100">
                  {data.hybridization} Hybridization
                 </span>
                 <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium border border-amber-100">
                  {data.bonds.length} Bonds
                 </span>
              </div>
            </div>

            {/* Description & Resonance */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Info size={16} /> Description
                    </h4>
                    <p className="text-slate-700 leading-relaxed mb-4">{data.description}</p>
                    
                    {data.resonanceInfo && (
                        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                             <h5 className="text-indigo-900 font-semibold text-sm mb-2 flex items-center gap-2">
                                <Layers size={14} /> Resonance Structures
                             </h5>
                             <p className="text-indigo-800 text-sm">{data.resonanceInfo}</p>
                        </div>
                    )}
                </div>

                {/* Stats Panel */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Properties</h4>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                            <span className="text-slate-600">Total Atoms</span>
                            <span className="font-mono font-bold text-slate-900">{data.atoms.length}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                            <span className="text-slate-600">Lone Pairs</span>
                            <span className="font-mono font-bold text-slate-900">
                                {data.atoms.reduce((acc, a) => acc + a.lonePairs, 0)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                            <span className="text-slate-600">Charge</span>
                            <span className="font-mono font-bold text-slate-900">
                                {data.atoms.reduce((acc, a) => acc + a.charge, 0)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Visualizers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px] lg:h-[500px]">
              
              {/* 2D Viewer */}
              <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Maximize2 size={16} /> Lewis Structure (2D)
                  </h4>
                  <div className="flex gap-2">
                    <button 
                        onClick={() => setShowLonePairs(!showLonePairs)}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${showLonePairs ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                    >
                        Lone Pairs
                    </button>
                    <button 
                        onClick={() => setShowCharges(!showCharges)}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${showCharges ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                    >
                        Charges
                    </button>
                  </div>
                </div>
                <div className="flex-1 p-4 relative">
                   <LewisStructure data={data} showLonePairs={showLonePairs} showCharges={showCharges} />
                </div>
              </div>

              {/* 3D Viewer */}
              <div className="flex flex-col bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden text-white">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                  <h4 className="font-semibold text-slate-200 flex items-center gap-2">
                    <Orbit size={16} /> VSEPR Geometry (3D)
                  </h4>
                  <div className="flex gap-2">
                     <button 
                        onClick={() => setShowLabels3D(!showLabels3D)}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${showLabels3D ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50' : 'bg-transparent text-slate-400 border-slate-600 hover:border-slate-500'}`}
                    >
                        Labels
                    </button>
                  </div>
                </div>
                <div className="flex-1 relative">
                    <Molecule3D data={data} showLabels={showLabels3D} />
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 mt-12">
          <div className="max-w-7xl mx-auto px-6 text-center text-slate-400 text-sm">
              <p>&copy; {new Date().getFullYear()} MoleculeGenius AI. Powered by Google Gemini.</p>
          </div>
      </footer>
    </div>
  );
};

export default App;