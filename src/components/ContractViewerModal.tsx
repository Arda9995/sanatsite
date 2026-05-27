import { useState, useRef, useEffect } from 'react';
import { X, ArrowDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import contractsData from '../data/contracts/contracts.json';

interface ContractViewerModalProps {
  contractKey: string;
  onAccept?: () => void;
  onReject?: () => void;
  onClose: () => void;
  viewOnly?: boolean;
}

export default function ContractViewerModal({
  contractKey,
  onAccept,
  onReject,
  onClose,
  viewOnly = false
}: ContractViewerModalProps) {
  const { language } = useLanguage();
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Normalize key to handle any OS NFD/NFC unicode variances
  const normalizedKey = contractKey.normalize('NFD').toLowerCase();
  
  // Find contract in JSON data
  const contract = Object.entries(contractsData).find(([k]) => k.normalize('NFD').toLowerCase() === normalizedKey)?.[1];
  
  const title = contract ? contract.title : contractKey;
  const content = contract ? contract.content : 'İçerik yüklenemedi.';

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Detect if user has scrolled to the bottom (within a 20px threshold)
    const isBottom =
      container.scrollHeight - container.scrollTop <= container.clientHeight + 20;

    if (isBottom) {
      setHasScrolledToBottom(true);
    }
  };

  // Check if content fits without scrolling
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // A small timeout to ensure the DOM has fully rendered
    const timer = setTimeout(() => {
      if (container.scrollHeight <= container.clientHeight) {
        setHasScrolledToBottom(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [content]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full h-[80vh] flex flex-col relative overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-bold bg-gradient-to-r from-pink-500 via-orange-600 to-yellow-500 bg-clip-text text-transparent truncate max-w-[55vw]">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Reader Area */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto bg-gray-50/50 p-6 flex justify-center"
        >
          {/* Document Sheet */}
          <div className="bg-white max-w-2xl w-full p-8 md:p-10 shadow-lg rounded-2xl border border-gray-100 min-h-max select-text text-gray-700 leading-relaxed text-left relative overflow-hidden">
            {/* Ambient gradients */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-200/10 rounded-full blur-3xl pointer-events-none" />

            <h2 className="text-center font-extrabold text-lg md:text-xl mb-6 bg-gradient-to-r from-pink-500 via-orange-600 to-yellow-500 bg-clip-text text-transparent border-b border-gray-100 pb-4 uppercase tracking-wide">
              {title}
            </h2>
            <p className="whitespace-pre-wrap text-sm md:text-base font-light text-gray-600">
              {content}
            </p>
          </div>
        </div>

        {/* Action / Status Footer */}
        <div className="border-t border-gray-100 px-6 py-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
          {viewOnly ? (
            <div className="flex justify-end w-full">
              <button
                onClick={onClose}
                className="px-8 py-2.5 bg-gradient-to-r from-pink-400 via-orange-500 to-yellow-500 text-white rounded-full font-semibold hover:shadow-lg transition-all text-sm shadow-md cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {language === 'tr' ? 'Kapat' : 'Close'}
              </button>
            </div>
          ) : !hasScrolledToBottom ? (
            <div className="flex items-center justify-center w-full text-xs md:text-sm text-orange-600 font-semibold animate-pulse gap-2 py-2">
              <ArrowDown className="w-4 h-4 animate-bounce" />
              {language === 'tr' 
                ? 'Lütfen onaylamak için sözleşmeyi sonuna kadar okuyunuz.' 
                : 'Please scroll to the bottom of the document to accept.'}
            </div>
          ) : (
            <div className="flex gap-4 w-full sm:justify-end justify-between animate-fadeIn">
              <button
                onClick={onReject}
                className="flex-1 sm:flex-initial px-8 py-2.5 bg-gradient-to-r from-pink-400 via-orange-500 to-yellow-500 text-white rounded-full font-semibold hover:shadow-lg transition-all text-sm shadow-md text-center transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                {language === 'tr' ? 'Reddet' : 'Reject'}
              </button>
              <button
                onClick={onAccept}
                className="flex-1 sm:flex-initial px-8 py-2.5 bg-gradient-to-r from-pink-400 via-orange-500 to-yellow-500 text-white rounded-full font-semibold hover:shadow-lg transition-all text-sm shadow-md text-center transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                {language === 'tr' ? 'Kabul Et' : 'Accept'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
