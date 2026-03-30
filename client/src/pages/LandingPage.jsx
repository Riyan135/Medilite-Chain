import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Activity, Clock, FileText, ArrowRight, ChevronDown, UserPlus, Users, X, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import toast from 'react-hot-toast';

const LandingPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 relative selection:bg-blue-600/20 selection:text-blue-900">
      {/* Animated Background Gradients */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-400/20 blur-[120px] animate-float"></div>
        <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-purple-400/20 to-blue-400/20 blur-[120px] animate-float" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-12 border-b border-white/40 bg-white/60 backdrop-blur-2xl sticky top-0 z-50 shadow-sm shadow-blue-900/5">
        <div className="flex items-center gap-2">
          <Activity className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900 tracking-tight">MediLite</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
          {/* <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How it Works</a> */}
          {user ? (
            <>
              {user.role === 'PATIENT' && (
                <Link to="/family-profiles" className="flex items-center gap-1 hover:text-blue-600 transition-colors font-medium">
                  <Users className="w-4 h-4" />
                  Family Profiles
                </Link>
              )}
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
      <section className="px-6 py-20 md:py-32 md:px-12 max-w-7xl mx-auto text-center relative z-10 animate-slide-up-fade">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/50 text-blue-700 px-5 py-2 rounded-full text-sm font-bold mb-8 shadow-sm">
          <Shield className="h-4 w-4 text-blue-600" />
          <span>Secure. Private. Patient-First.</span>
        </div>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tighter">
          Your Health, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">In Your Hands.</span>
        </h1>
        <p className="text-lg md:text-2xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
          The ultimate platform for patients. Manage your medical records,
          schedule reminders, and track your health timeline with total privacy.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {user ? (
            <Link to="/dashboard" className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-blue-700 hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2">
              Go to Portal <ArrowRight className="h-5 w-5" />
            </Link>
          ) : (
            <>
              <Link to="/sign-up" className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-blue-700 hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2">
                Start Free Journey <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/sign-in" className="w-full sm:w-auto bg-white/80 backdrop-blur border-2 border-slate-200/50 text-slate-800 px-8 py-4 rounded-2xl font-black text-lg hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-1 transition-all duration-300">
                Login to Portal
              </Link>
            </>
          )}
        </div>
        {/* Mockup Preview */}
        {/* <div className="mt-20 relative">
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
        </div> */}
      </section>

      <section id="features" className="relative z-10 py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-slide-up-fade" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Powerful Features for Better Care</h2>
            <p className="text-slate-600 text-lg md:text-xl max-w-2xl mx-auto font-medium">Everything you need to stay on top of your health journey in one beautiful application.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Clock className="h-6 w-6 text-blue-600" />}
              title="Smart Reminders"
              description="Never miss a dose. Get real-time notifications for your medications."
              delay="0.3s"
            />
            <FeatureCard
              icon={<FileText className="h-6 w-6 text-emerald-600" />}
              title="Health Timeline"
              description="Visualize your medical history in a sleek, interactive timeline view."
              delay="0.4s"
            />
            <FeatureCard
              icon={<Activity className="h-6 w-6 text-purple-600" />}
              title="Secure Records"
              description="Store and access your medical reports securely from anywhere."
              delay="0.5s"
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6 text-rose-600" />}
              title="Doctor Insights"
              description="Share your profile with doctors for more accurate consultations."
              delay="0.6s"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-6 md:px-12 mb-12">
        <div className="max-w-5xl mx-auto text-center bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 text-white rounded-[3rem] p-12 md:p-20 shadow-2xl shadow-blue-900/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <h2 className="text-4xl md:text-6xl font-black mb-8 relative z-10 tracking-tight">Ready to transform your healthcare?</h2>
          <p className="text-xl text-blue-100 mb-12 font-medium max-w-2xl mx-auto relative z-10">Join thousands of users who trust MediLite for their most important medical needs.</p>
          <Link to="/sign-up" className="relative z-10 bg-white text-blue-600 px-10 py-5 rounded-2xl font-black text-xl hover:bg-slate-50 hover:-translate-y-1 transition-all duration-300 inline-block shadow-xl shadow-black/10">
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

const FeatureCard = ({ icon, title, description, delay }) => (
  <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white/80 hover:shadow-2xl hover:shadow-blue-900/5 hover:border-blue-100/50 hover:-translate-y-2 transition-all duration-500 group animate-slide-up-fade" style={{ animationDelay: delay }}>
    <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-100 shadow-sm p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
      {icon}
    </div>
    <h3 className="text-2xl font-black text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-500 font-medium leading-relaxed">{description}</p>
  </div>
);

export default LandingPage;
