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
      emojis: [
        { emoji: '😀', keywords: ['grinning', 'smile', 'happy', 'joy'] },
        { emoji: '🙂', keywords: ['slight smile', 'content', 'happy'] },
        { emoji: '😐', keywords: ['neutral', 'meh', 'okay'] },
        { emoji: '🙁', keywords: ['sad', 'down'] },
        { emoji: '😢', keywords: ['cry', 'tears', 'sad'] },
        { emoji: '😡', keywords: ['angry', 'mad', 'rage'] },
        { emoji: '😤', keywords: ['frustrated', 'triumph'] },
        { emoji: '😱', keywords: ['scream', 'shock', 'surprised'] },
        { emoji: '😴', keywords: ['sleep', 'tired'] },
        { emoji: '🤒', keywords: ['sick', 'ill'] },
        { emoji: '🤗', keywords: ['hug', 'comfort', 'care'] },
      ],
    },
    {
      name: 'Activities',
      icon: '🏃',
      emojis: [
        { emoji: '🏃', keywords: ['run', 'exercise', 'activity'] },
        { emoji: '🧘', keywords: ['meditate', 'calm', 'yoga'] },
        { emoji: '🎵', keywords: ['music', 'listen', 'song'] },
        { emoji: '📚', keywords: ['read', 'study', 'book'] },
        { emoji: '☕', keywords: ['tea', 'coffee', 'break'] },
        { emoji: '🛌', keywords: ['rest', 'sleep', 'nap'] },
        { emoji: '🍽️', keywords: ['eat', 'meal', 'food'] },
        { emoji: '🚶', keywords: ['walk', 'stroll', 'outdoors'] },
      ],
    },
    {
      name: 'Nature',
      icon: '🌿',
      emojis: [
        { emoji: '🌞', keywords: ['sun', 'sunny', 'day'] },
        { emoji: '🌧️', keywords: ['rain', 'rainy', 'weather'] },
        { emoji: '🌈', keywords: ['rainbow', 'bright'] },
        { emoji: '🌙', keywords: ['moon', 'night'] },
        { emoji: '⭐', keywords: ['star', 'night', 'sparkle'] },
        { emoji: '🌸', keywords: ['flower', 'bloom'] },
        { emoji: '🌿', keywords: ['leaf', 'plant', 'green'] },
        { emoji: '🔥', keywords: ['fire', 'hot'] },
      ],
    },
    {
      name: 'Objects',
      icon: '📦',
      emojis: [
        { emoji: '📱', keywords: ['phone', 'mobile'] },
        { emoji: '💡', keywords: ['idea', 'lightbulb'] },
        { emoji: '⌛', keywords: ['wait', 'time', 'hourglass'] },
        { emoji: '📝', keywords: ['note', 'write', 'journal'] },
        { emoji: '🔔', keywords: ['bell', 'reminder', 'alert'] },
        { emoji: '🎁', keywords: ['gift', 'present'] },
        { emoji: '🎧', keywords: ['headphones', 'music'] },
      ],
    },
    {
      name: 'Symbols',
      icon: '❤️',
      emojis: [
        { emoji: '❤️', keywords: ['heart', 'love'] },
        { emoji: '💔', keywords: ['broken heart', 'sad'] },
        { emoji: '✨', keywords: ['sparkles', 'magic'] },
        { emoji: '❗', keywords: ['exclamation', 'important'] },
        { emoji: '❓', keywords: ['question', 'help'] },
        { emoji: '✅', keywords: ['check', 'done'] },
        { emoji: '⚠️', keywords: ['warning', 'caution'] },
        { emoji: '➕', keywords: ['plus', 'add'] },
      ],
    },
  ];

  // Filter emojis based on search term (by keywords)
  const getFilteredEmojis = () => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return emojiCategories
        .map((category) => ({
          ...category,
          emojis: category.emojis.filter((item) =>
            item.keywords.some((k) => k.toLowerCase().includes(q))
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
                {category.emojis.map((item) => (
                  <button
                    key={item.emoji}
                    type="button"
                    className="emoji-option"
                    onClick={() => handleEmojiClick(item.emoji)}
                    aria-label={`Select ${item.emoji}`}
                  >
                    {item.emoji}
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
