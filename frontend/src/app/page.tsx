import Link from 'next/link';
import { Activity, ShieldCheck, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center w-full flex-grow">
      {/* Hero Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-semibold mb-8 border border-indigo-100">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          Next-Gen Healthcare AI
        </div>
        <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
          Personalized Medicine, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Powered by Data</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed">
          Predict diseases from symptoms and receive tailored, context-aware recommendations for medications, diets, and workouts.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/register" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5">
            Start Your Diagnosis
          </Link>
          <Link href="/login" className="px-8 py-4 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl font-bold text-lg shadow-sm transition-all">
            Access Dashboard
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="w-full bg-slate-100/50 py-20 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Zap className="w-6 h-6 text-amber-500" />}
              title="Instant Disease Prediction"
              description="Input your symptoms and get high-accuracy diagnostic predictions powered by advanced ML models."
            />
            <FeatureCard
              icon={<ShieldCheck className="w-6 h-6 text-emerald-500" />}
              title="Explainable AI (SHAP)"
              description="Transparency matters. See exactly which symptoms contributed most to your prediction."
            />
            <FeatureCard
              icon={<Activity className="w-6 h-6 text-indigo-500" />}
              title="Holistic Recommendations"
              description="Get personalized medicine, tailored diet plans, and workout routines all in one place."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-start transition-all hover:shadow-md hover:-translate-y-1">
      <div className="p-3 bg-slate-50 rounded-xl mb-5">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}
