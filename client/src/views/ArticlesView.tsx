import React, { useState } from 'react';
import { Article } from '../types';
import { triggerHaptic } from '../api';
import { BookOpen, Clock, X, ChevronRight } from 'lucide-react';

interface ArticlesViewProps {
  articles: Article[];
}

export const ArticlesView: React.FC<ArticlesViewProps> = ({ articles }) => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  return (
    <div className="space-y-4 max-w-md mx-auto pb-24 px-4 pt-2">
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-white light:text-[#1d2939]">Moliyaviy Bilimlar</h2>
        <p className="text-xs text-[#899098]">Moliyaviy erkinlik va tejamkorlik maqolalari</p>
      </div>

      {/* Articles List */}
      <div className="space-y-3">
        {articles.map((art) => (
          <div
            key={art.id}
            onClick={() => {
              triggerHaptic('light');
              setSelectedArticle(art);
            }}
            className="rounded-3xl bg-[#213040] light:bg-white border border-[#354454] light:border-[#eaecf0] overflow-hidden shadow-md cursor-pointer group active:scale-98 transition-all"
          >
            <div className="h-36 w-full overflow-hidden relative">
              <img
                src={art.image_url}
                alt={art.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-black/60 backdrop-blur-md text-white">
                {art.category}
              </span>
            </div>

            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-[11px] text-[#899098]">
                <Clock className="w-3.5 h-3.5" />
                <span>{art.read_time}</span>
                <span>•</span>
                <span>{art.date}</span>
              </div>

              <h3 className="text-sm font-bold text-white light:text-[#1d2939] group-hover:text-[#29c184] transition-colors leading-snug">
                {art.title}
              </h3>

              <p className="text-xs text-[#b6bfd0] light:text-[#475467] line-clamp-2">
                {art.summary}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Full Article Reader Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-[#19232e] light:bg-white rounded-3xl border border-[#354454] max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
            <div className="sticky top-0 z-10 p-4 bg-[#19232e]/90 light:bg-white/90 backdrop-blur-md border-b border-[#354454]/60 flex items-center justify-between">
              <span className="text-xs font-bold text-[#29c184] uppercase">
                {selectedArticle.category}
              </span>
              <button
                onClick={() => setSelectedArticle(null)}
                className="w-8 h-8 rounded-full bg-[#213040] flex items-center justify-center text-[#899098] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <h2 className="text-xl font-black text-white light:text-[#1d2939] leading-snug">
                {selectedArticle.title}
              </h2>

              <div className="rounded-2xl overflow-hidden h-48">
                <img
                  src={selectedArticle.image_url}
                  alt={selectedArticle.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="text-xs text-[#b6bfd0] light:text-[#344054] leading-relaxed whitespace-pre-line space-y-3 font-medium">
                {selectedArticle.content}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
