'use client';

import { useState } from 'react';

const EmojiPicker = ({ onSelect, onEmojiSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Feelings');

  // Support both prop names
  const emit = onSelect || onEmojiSelect;

  const emojiCategories = [
    {
      name: 'Feelings',
      icon: '😊',
      emojis: ['😀', '🙂', '😐', '🙁', '😢', '😭', '😡', '😤', '😱', '😴', '🤒', '🤗'],
    },
    {
      name: 'Activities',
      icon: '🎮',
      emojis: ['🎧', '📖', '🏃', '🧘', '☕', '🍽️', '🛌', '✍️', '🎮'],
    },
    {
      name: 'Nature',
      icon: '🌻',
      emojis: ['🌞', '🌙', '⭐', '☁️', '🌧️', '🌈', '🌻', '🌲', '🌊'],
    },
    {
      name: 'Objects',
      icon: '💻',
      emojis: ['📱', '💻', '🕰️', '🎁', '📷', '🔑', '💡', '📝', '🎒'],
    },
    {
      name: 'Symbols',
      icon: '❤️',
      emojis: ['❤️', '💔', '✨', '🔥', '❄️', '✅', '❌', '⚠️', '🎯'],
    },
  ];

  // Filter emojis based on search term
  const getFilteredEmojis = () => {
    if (searchTerm.trim()) {
      // When searching, show all matching emojis from all categories
      return emojiCategories
        .map((category) => ({
          ...category,
          emojis: category.emojis.filter((emoji) =>
            emoji.toLowerCase().includes(searchTerm.toLowerCase())
          ),
        }))
        .filter((category) => category.emojis.length > 0);
    }
    // Otherwise show only active category
    return emojiCategories.filter((cat) => cat.name === activeCategory);
  };

  const handleEmojiClick = (emoji) => {
    if (emit) emit(emoji);
  };

  const filteredCategories = getFilteredEmojis();

  return (
    <div className="emoji-picker">
      {/* Search Input */}
      <div className="emoji-search">
        <input
          type="text"
          placeholder="Search emojis..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="emoji-search-input"
          aria-label="Search emojis"
        />
      </div>

      {/* Category Tabs */}
      {!searchTerm && (
        <div className="emoji-tabs">
          {emojiCategories.map((category) => (
            <button
              key={category.name}
              className={`emoji-tab ${activeCategory === category.name ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.name)}
              aria-label={`${category.name} emojis`}
              aria-pressed={activeCategory === category.name}
              title={category.name}
            >
              <span className="emoji-tab-icon">{category.icon}</span>
            </button>
          ))}
        </div>
      )}

      {/* Emoji Categories */}
      <div className="emoji-categories">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category) => (
            <div key={category.name} className="emoji-category">
              {searchTerm && <div className="emoji-category-name">{category.name}</div>}
              <div className="emoji-list">
                {category.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="emoji-option"
                    onClick={() => handleEmojiClick(emoji)}
                    aria-label={`Select ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="emoji-no-results">
            <p>No emojis found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmojiPicker;
