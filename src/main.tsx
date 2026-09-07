import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component<React.PropsWithChildren, {hasError:boolean; message:string}> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = {hasError:false, message:''};
  }
  static getDerivedStateFromError(error: Error) {
    return {hasError:true, message:error?.message || 'Erro inesperado na interface.'};
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Erro da interface Seedance:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070811] grid place-items-center p-6 text-white">
          <div className="w-full max-w-xl rounded-3xl border border-rose-500/30 bg-[#0d0f1b] p-6">
            <h1 className="text-xl font-black">O painel encontrou um erro</h1>
            <p className="mt-3 text-sm text-rose-200">{this.state.message}</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold">Recarregar painel</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary><App /></ErrorBoundary>
  </React.StrictMode>
);
