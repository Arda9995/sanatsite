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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full h-[85vh] flex flex-col relative overflow-hidden border border-gray-200">
        {/* PDF Viewer-style Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-red-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
              PDF
            </div>
            <h3 className="text-sm font-semibold truncate max-w-[50vw]">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable PDF Page View */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto bg-gray-600 p-6 flex justify-center"
        >
          {/* A4 sheet styling */}
          <div className="bg-white max-w-2xl w-full p-8 md:p-12 shadow-2xl rounded-sm border border-gray-400 min-h-max prose prose-sm select-text text-gray-800 leading-relaxed text-justify">
            <h2 className="text-center font-bold text-lg md:text-xl mb-6 text-gray-900 border-b pb-4 uppercase tracking-wide">
              {title}
            </h2>
            <p className="whitespace-pre-wrap text-sm md:text-base font-light">
              {content}
            </p>
          </div>
        </div>

        {/* Action / Status Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
          {viewOnly ? (
            <div className="flex justify-end w-full">
              <button
                onClick={onClose}
                className="px-8 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors text-sm shadow-md"
              >
                {language === 'tr' ? 'Kapat' : 'Close'}
              </button>
            </div>
          ) : !hasScrolledToBottom ? (
            <div className="flex items-center justify-center w-full text-sm text-orange-600 font-semibold animate-pulse gap-2 py-2">
              <ArrowDown className="w-4 h-4 animate-bounce" />
              {language === 'tr' 
                ? 'Lütfen onaylamak için sözleşmeyi sonuna kadar okuyunuz.' 
                : 'Please scroll to the bottom of the document to accept.'}
            </div>
          ) : (
            <div className="flex gap-4 w-full sm:justify-end justify-between animate-fadeIn">
              <button
                onClick={onReject}
                className="flex-1 sm:flex-initial px-8 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors text-sm shadow-md"
              >
                {language === 'tr' ? 'Reddet' : 'Reject'}
              </button>
              <button
                onClick={onAccept}
                className="flex-1 sm:flex-initial px-8 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors text-sm shadow-md"
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
