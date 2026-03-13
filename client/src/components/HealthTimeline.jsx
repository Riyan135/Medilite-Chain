import React from 'react';
import { Calendar, FileText, ChevronRight, Clock } from 'lucide-react';

const TimelineItem = ({ record, isLast }) => {
  const icons = {
    REPORT: 'bg-blue-500',
    BILL: 'bg-emerald-500',
    PRESCRIPTION: 'bg-red-500',
    LAB_TEST: 'bg-indigo-500'
  };

  return (
    <div className="relative pl-8 pb-8 group">
      {!isLast && <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-slate-100 group-hover:bg-primary/20 transition-colors" />}
      
      <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm z-10 ${icons[record.type] || 'bg-slate-400'}`} />
      
      <div className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-primary/30 hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-bold text-primary px-2 py-1 bg-primary/10 rounded-md uppercase tracking-wider">
            {record.type.replace('_', ' ')}
          </span>
          <div className="flex items-center text-slate-400 text-xs">
            <Clock className="w-3 h-3 mr-1" />
            {record.date}
          </div>
        </div>
        <h4 className="text-lg font-bold text-slate-900 mb-2">{record.title}</h4>
        <p className="text-sm text-slate-500 mb-4 line-clamp-2">{record.description || 'No description provided.'}</p>
        
        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-2">
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <span className="text-sm font-medium text-slate-600 truncate max-w-[150px]">
              {record.title}.pdf
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
        </div>
      </div>
    </div>
  );
};

const HealthTimeline = ({ records }) => {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="flex items-center mb-10">
        <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 mr-4">
          <Calendar className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Health Timeline</h2>
          <p className="text-slate-500 text-sm">A complete chronological history of your medical journey.</p>
        </div>
      </div>

      <div className="space-y-2">
        {records.length > 0 ? (
          records.map((record, index) => (
            <TimelineItem 
              key={record.id} 
              record={record} 
              isLast={index === records.length - 1} 
            />
          ))
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">No records found. Start by uploading your first report!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthTimeline;
