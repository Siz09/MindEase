import { useState, useEffect } from 'react';
import { Button, Input, Select, Modal } from './shared';
import RichTextEditor from './RichTextEditor';

export default function ContentForm({ isOpen, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'mental-health',
    type: 'article',
    imageUrl: '',
    body: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        category: initialData.category || 'mental-health',
        type: initialData.type || 'article',
        imageUrl: initialData.imageUrl || '',
        body: initialData.body || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'mental-health',
        type: 'article',
        imageUrl: '',
        body: '',
      });
    }
  }, [initialData]);

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }
    if (!formData.description.trim()) {
      alert('Description is required');
      return;
    }
    if (!formData.body.trim()) {
      alert('Content body is required');
      return;
    }
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      title={initialData ? 'Edit Content' : 'Create New Content'}
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {initialData ? 'Save Changes' : 'Create Content'}
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Title</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter content title"
            fullWidth
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Type</label>
            <Select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={[
                { value: 'article', label: 'Article' },
                { value: 'exercise', label: 'Exercise' },
                { value: 'tool', label: 'Tool' },
              ]}
              fullWidth
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
              Category
            </label>
            <Select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={[
                { value: 'mental-health', label: 'Mental Health' },
                { value: 'meditation', label: 'Meditation' },
                { value: 'anxiety', label: 'Anxiety' },
                { value: 'stress', label: 'Stress' },
                { value: 'sleep', label: 'Sleep' },
              ]}
              fullWidth
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
            Description (Summary)
          </label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Short description for the card view"
            fullWidth
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
            Image URL
          </label>
          <Input
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            placeholder="https://example.com/image.jpg"
            fullWidth
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
            Content Body
          </label>
          <RichTextEditor
            value={formData.body}
            onChange={(val) => setFormData({ ...formData, body: val })}
          />
        </div>
      </div>
    </Modal>
  );
}
