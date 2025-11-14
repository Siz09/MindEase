'use client';

import { useState, useEffect } from 'react';
import { Button, Badge, FilterBar, Select, Input, Modal, Card } from '../components/shared';
import adminApi from '../adminApi';

export default function ContentLibrary() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
  });

  const [selectedContent, setSelectedContent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadContent();
  }, [activeTab, filters]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: activeTab === 'all' ? '' : activeTab,
      });
      if (filters.search) params.append('search', filters.search);
      if (filters.category !== 'all') params.append('category', filters.category);

      const { data } = await adminApi.get(`/admin/content?${params.toString()}`);

      setContent(Array.isArray(data) ? data : data.content || []);
    } catch (err) {
      console.error(
        'Failed to load content:',
        err.response?.data?.message || err.message || String(err)
      );
      // TODO: Show user-facing error notification
      setContent([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContent = async (contentId) => {
    if (!window.confirm('Are you sure you want to delete this content?')) return;
    try {
      await adminApi.delete(`/admin/content/${contentId}`);
      loadContent();
      setShowModal(false);
    } catch (err) {
      console.error(
        'Failed to delete content:',
        err.response?.data?.message || err.message || String(err)
      );
    }
  };

  const handleContentClick = (item) => {
    setSelectedContent(item);
    setShowModal(true);
  };

  const tabs = [
    { id: 'all', label: 'All Content' },
    { id: 'articles', label: 'Articles' },
    { id: 'exercises', label: 'Exercises' },
    { id: 'tools', label: 'Tools' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Content Library</h1>
        <p className="page-subtitle">Manage wellness resources, articles, and exercises</p>
        <div className="page-actions">
          <Button variant="primary">+ Create New Content</Button>
        </div>
      </div>

      <div
        className="bento-card"
        style={{
          marginBottom: 'var(--spacing-lg)',
          display: 'flex',
          borderBottom: '1px solid var(--gray-light)',
          padding: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--gray-light)',
            gap: 'var(--spacing-lg)',
            width: '100%',
            padding: '0 var(--spacing-lg)',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: 'var(--spacing-md) 0',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? '600' : '400',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--gray)',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : 'none',
                transition: 'var(--transition-fast)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <FilterBar>
          <Input
            placeholder="Search by title or description..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ flex: 1, maxWidth: '300px' }}
          />
          <Select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            options={[
              { value: 'all', label: 'All Categories' },
              { value: 'mental-health', label: 'Mental Health' },
              { value: 'meditation', label: 'Meditation' },
              { value: 'anxiety', label: 'Anxiety' },
              { value: 'stress', label: 'Stress' },
              { value: 'sleep', label: 'Sleep' },
            ]}
            style={{ width: '180px' }}
          />
          <Button variant="ghost" onClick={() => setFilters({ search: '', category: 'all' })}>
            Clear
          </Button>
        </FilterBar>
      </div>

      <div className="bento-card">
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--gray)', padding: 'var(--spacing-2xl)' }}>
            Loading content...
          </div>
        ) : content.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--gray)', padding: 'var(--spacing-2xl)' }}>
            No content found
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 'var(--spacing-lg)',
              padding: 'var(--spacing-lg)',
            }}
          >
            {content.map((item) => (
              <Card
                key={item.id}
                header={
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div className="card-header-title" style={{ fontSize: '14px' }}>
                      {item.title}
                    </div>
                  </div>
                }
                className="card"
                style={{ cursor: 'pointer' }}
                onClick={() => handleContentClick(item)}
              >
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.title || 'Content image'}
                    style={{
                      width: '100%',
                      height: '150px',
                      backgroundColor: 'var(--gray-lighter)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: 'var(--spacing-md)',
                      objectFit: 'cover',
                    }}
                  />
                )}

                <p
                  style={{
                    fontSize: '12px',
                    color: 'var(--gray)',
                    margin: '0 0 var(--spacing-sm) 0',
                  }}
                >
                  {item.category || 'Uncategorized'}
                </p>

                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--dark)',
                    lineHeight: '1.5',
                    margin: '0 0 var(--spacing-md) 0',
                    display: '-webkit-box',
                    WebkitLineClamp: '2',
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {item.description || 'No description'}
                </p>

                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                    <span style={{ fontSize: '12px', color: '#fbbf24' }}>★</span>
                    <span style={{ fontSize: '12px', color: 'var(--gray)' }}>
                      {item.rating || 0} ({item.reviewCount || 0})
                    </span>
                  </div>
                  <Badge type="info" style={{ fontSize: '10px' }}>
                    {item.type || 'Content'}
                  </Badge>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 'var(--spacing-sm)',
                    marginTop: 'var(--spacing-md)',
                    paddingTop: 'var(--spacing-md)',
                    borderTop: '1px solid var(--gray-light)',
                  }}
                >
                  <Button variant="ghost" size="sm" style={{ flex: 1 }}>
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteContent(item.id);
                    }}
                    style={{ flex: 1 }}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Content Detail Modal */}
      <Modal
        isOpen={showModal}
        title={selectedContent?.title || 'Content Details'}
        onClose={() => setShowModal(false)}
        footer={
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Close
            </Button>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Edit
            </Button>
            <Button variant="danger" onClick={() => handleDeleteContent(selectedContent?.id)}>
              Delete
            </Button>
          </div>
        }
      >
        {selectedContent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {selectedContent.imageUrl && (
              <img
                src={selectedContent.imageUrl || '/placeholder.svg'}
                alt={selectedContent.title}
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-md)',
                }}
              />
            )}

            <div>
              <label style={{ fontWeight: 600, color: 'var(--gray)' }}>Type</label>
              <p style={{ margin: '4px 0 0 0' }}>
                <Badge type="info">{selectedContent.type || 'Content'}</Badge>
              </p>
            </div>

            <div>
              <label style={{ fontWeight: 600, color: 'var(--gray)' }}>Category</label>
              <p style={{ margin: '4px 0 0 0', color: 'var(--dark)' }}>
                {selectedContent.category || 'Uncategorized'}
              </p>
            </div>

            <div>
              <label style={{ fontWeight: 600, color: 'var(--gray)' }}>Rating</label>
              <p style={{ margin: '4px 0 0 0', color: 'var(--dark)' }}>
                ★ {selectedContent.rating || 0} ({selectedContent.reviewCount || 0} reviews)
              </p>
            </div>

            <div>
              <label style={{ fontWeight: 600, color: 'var(--gray)' }}>Description</label>
              <p style={{ margin: '4px 0 0 0', color: 'var(--dark)', lineHeight: '1.6' }}>
                {selectedContent.description || 'No description provided'}
              </p>
            </div>

            <div>
              <label style={{ fontWeight: 600, color: 'var(--gray)' }}>Created</label>
              <p style={{ margin: '4px 0 0 0', color: 'var(--dark)', fontSize: '12px' }}>
                {selectedContent.createdAt
                  ? new Date(selectedContent.createdAt).toLocaleString()
                  : 'N/A'}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
