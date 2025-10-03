import { useState } from 'react';

const EmojiPicker = ({ onEmojiSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Popular emojis for mental health/journaling
  const emojiCategories = [
    {
      name: 'Feelings',
      emojis: ['😊', '😢', '😠', '😴', '😰', '😍', '🤔', '😌', '😔', '🤗', '🥺', '😎'],
    },
    {
      name: 'Activities',
      emojis: ['📝', '🎯', '💪', '🚶', '🧘', '🎵', '📚', '🎮', '🏃', '🚴'],
    },
    {
      name: 'Nature',
      emojis: ['🌞', '🌙', '⭐', '🌧️', '🌈', '🌻', '🌊', '🏔️', '🍃'],
    },
    {
      name: 'Objects',
      emojis: ['💭', '📖', '✏️', '🎨', '🎭', '💡', '🔍', '📊', '⏰'],
    },
    {
      name: 'Symbols',
      emojis: ['❤️', '✨', '🌟', '🎉', '💫', '🔥', '💧', '🌱', '🌀'],
    },
  ];

  const filteredCategories = emojiCategories
    .map((category) => ({
      ...category,
      emojis: category.emojis.filter((emoji) =>
        emoji.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((category) => category.emojis.length > 0);

  const handleEmojiClick = (emoji) => {
    onEmojiSelect(emoji);
  };

  return (
    <div className="emoji-picker">
      <div className="emoji-search">
        <input
          type="text"
          placeholder="Search emojis..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="emoji-search-input"
        />
      </div>

      <div className="emoji-categories">
        {filteredCategories.map((category) => (
          <div key={category.name} className="emoji-category">
            <div className="emoji-category-name">{category.name}</div>
            <div className="emoji-list">
              {category.emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="emoji-option"
                  onClick={() => handleEmojiClick(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;
