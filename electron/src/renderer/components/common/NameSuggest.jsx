import React, { useState, useEffect } from 'react';
import { HiCheck, HiX, HiLightBulb } from 'react-icons/hi';
import { findSuggestions, autoCorrectName } from '../../utils/nameMatcher';

const NameSuggest = ({ extractedName, type = 'sender', onSelect, onIgnore }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (extractedName && extractedName.length >= 3) {
      const matches = findSuggestions(extractedName, type);
      setSuggestions(matches);
      // Auto-show if we have high confidence matches
      if (matches.length > 0 && matches[0].confidence >= 80) {
        setShowSuggestions(true);
      }
    }
  }, [extractedName, type]);

  if (!extractedName || suggestions.length === 0) return null;

  return (
    <div className="mt-2">
      {/* Suggestion Toggle */}
      <button
        onClick={() => setShowSuggestions(!showSuggestions)}
        className="flex items-center space-x-1 text-xs text-amber-600 hover:text-amber-700"
      >
        <HiLightBulb className="h-3.5 w-3.5" />
        <span>
          {suggestions.length} similar {type} name{suggestions.length > 1 ? 's' : ''} found
        </span>
      </button>

      {/* Suggestions List */}
      {showSuggestions && (
        <div className="mt-2 space-y-1">
          <p className="text-xs text-gray-500 mb-2">
            OCR extracted: <span className="font-medium text-red-500">"{extractedName}"</span>
            {suggestions[0]?.confidence >= 90 && (
              <span className="ml-2 text-amber-600">— Likely a typo!</span>
            )}
          </p>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
            >
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">
                  {suggestion.name}
                </span>
                <span className="rounded-full bg-amber-200 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                  {suggestion.confidence}% match
                </span>
              </div>
              <button
                onClick={() => {
                  onSelect(suggestion.name);
                  setShowSuggestions(false);
                }}
                className="flex items-center space-x-1 rounded bg-green-500 px-2 py-1 text-xs font-medium text-white hover:bg-green-600"
              >
                <HiCheck className="h-3 w-3" />
                <span>Use This</span>
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              onIgnore();
              setShowSuggestions(false);
            }}
            className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700"
          >
            <HiX className="h-3 w-3" />
            <span>Keep extracted name</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default NameSuggest;