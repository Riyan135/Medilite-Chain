import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Activity, Clock, FileText, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-12 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Activity className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900 tracking-tight">MediLite</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How it Works</a>
          {user ? (
            <>
              <Link to="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
              <button onClick={logout} className="text-gray-600 hover:text-red-600 transition-colors">Logout</button>
            </>
          ) : (
            <>
              <Link to="/sign-in" className="hover:text-blue-600 transition-colors">Login</Link>
              <Link to="/sign-up" className="bg-blue-600 text-white px-5 py-2.5 rounded-full hover:bg-blue-700 transition-all shadow-sm">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-16 md:py-28 md:px-12 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
          <Shield className="h-4 w-4" />
          <span>Secure. Private. Patient-First.</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-[1.1] mb-8 tracking-tight">
          Your Health, <br /> 
          <span className="text-blue-600">In Your Hands.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          The ultimate platform for patients. Manage your medical records, 
          schedule reminders, and track your health timeline with total privacy.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {user ? (
            <Link to="/dashboard" className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 hover:scale-[1.02] transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
              Go to Dashboard <ArrowRight className="h-5 w-5" />
            </Link>
          ) : (
            <>
              <Link to="/sign-up" className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 hover:scale-[1.02] transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
                Start Your Free Journey <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/sign-in" className="w-full sm:w-auto bg-white border-2 border-gray-200 text-gray-800 px-8 py-4 rounded-xl font-bold text-lg hover:border-gray-300 hover:bg-gray-50 transition-all">
                Login to Portal
              </Link>
            </>
          )}
        </div>
        {/* Mockup Preview */}
        <div className="mt-20 relative">
          <div className="absolute inset-0 bg-blue-400 blur-[100px] opacity-10 rounded-full h-2/3 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="relative bg-gray-50 border border-gray-200 rounded-2xl p-4 shadow-2xl">
            <div className="bg-white rounded-xl aspect-video flex items-center justify-center border border-gray-100 overflow-hidden">
               <div className="grid grid-cols-12 gap-4 w-full h-full p-6">
                  <div className="col-span-3 space-y-4">
                    <div className="h-8 bg-gray-100 rounded w-2/3"></div>
                    <div className="space-y-2">
                        {[1,2,3,4].map(i => <div key={i} className="h-6 bg-gray-50 rounded"></div>)}
                    </div>
                  </div>
                  <div className="col-span-9 space-y-6">
                    <div className="flex justify-between">
                        <div className="h-10 bg-gray-100 rounded w-1/3"></div>
                        <div className="h-10 bg-blue-50 rounded w-24"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-50 rounded-lg"></div>)}
                    </div>
                    <div className="h-48 bg-gray-100 rounded-lg w-full"></div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Powerful Features for Better Care</h2>
            <p className="text-gray-600 max-w-xl mx-auto">Everything you need to stay on top of your health journey in one beautiful application.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<Clock className="h-6 w-6 text-blue-600" />} 
              title="Smart Reminders" 
              description="Never miss a dose. Get real-time notifications for your medications." 
            />
            <FeatureCard 
              icon={<FileText className="h-6 w-6 text-green-600" />} 
              title="Health Timeline" 
              description="Visualize your medical history in a sleek, interactive timeline view." 
            />
            <FeatureCard 
              icon={<Activity className="h-6 w-6 text-purple-600" />} 
              title="Secure Records" 
              description="Store and access your medical reports securely from anywhere." 
            />
            <FeatureCard 
              icon={<Shield className="h-6 w-6 text-red-600" />} 
              title="Doctor Insights" 
              description="Share your profile with doctors for more accurate consultations." 
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 md:px-12 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-8">Ready to transform your healthcare experience?</h2>
          <p className="text-xl text-blue-100 mb-10">Join thousands of users who trust MediLite for their medical needs.</p>
          <Link to="/sign-up" className="bg-white text-blue-600 px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all inline-block shadow-lg">
            Create Your Profile Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100 px-6 md:px-12 text-center text-gray-500 text-sm">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-blue-600" />
          <span className="text-gray-900 font-bold">MediLite</span>
        </div>
        <p>&copy; 2026 MediLite Health Systems. All rights reserved.</p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-white p-8 rounded-2xl border border-gray-100 hover:shadow-xl hover:shadow-gray-100 transition-all group">
    <div className="bg-gray-50 p-3 rounded-xl w-fit mb-6 group-hover:scale-110 transition-all">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

export default LandingPage;
