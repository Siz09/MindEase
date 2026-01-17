'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import { Skeleton } from '../../components/ui/skeleton';
import { Label } from '../../components/ui/label';
import { AlertTriangle, Plus, Search, X, Edit, Trash2, Star } from 'lucide-react';
import ContentForm from '../components/ContentForm';
import adminApi from '../adminApi';

export default function ContentLibrary() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
  });
  const [selectedContent, setSelectedContent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [toast, setToast] = useState(null);

  const loadContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        type: activeTab === 'all' ? '' : activeTab.replace(/s$/, ''),
      });
      if (filters.search) params.append('search', filters.search);
      if (filters.category !== 'all') params.append('category', filters.category);

      const { data } = await adminApi.get(`/admin/content?${params.toString()}`);
      setContent(Array.isArray(data) ? data : data.content || []);
    } catch {
      setError('Unable to load content');
      setToast({
        type: 'error',
        message: 'Unable to load content. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const handleDeleteContent = async (contentId) => {
    if (!window.confirm('Are you sure you want to delete this content?')) return;
    try {
      await adminApi.delete(`/admin/content/${contentId}`);
      loadContent();
      setShowModal(false);
    } catch {
      setToast({
        type: 'error',
        message: 'Failed to delete content. Please try again.',
      });
    }
  };

  const handleCreateClick = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setShowForm(true);
    setShowModal(false);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingItem) {
        await adminApi.put(`/admin/content/${editingItem.id}`, formData);
        setToast({ type: 'success', message: 'Content updated successfully' });
      } else {
        await adminApi.post('/admin/content', formData);
        setToast({ type: 'success', message: 'Content created successfully' });
      }
      setShowForm(false);
      loadContent();
    } catch (err) {
      setToast({
        type: 'error',
        message: 'Failed to save content. Please try again.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Library</h1>
          <p className="text-muted-foreground">
            Manage wellness resources, articles, and exercises
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Content
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Content</TabsTrigger>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title or description..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-9"
              />
            </div>
            <Select
              value={filters.category}
              onValueChange={(value) => setFilters({ ...filters, category: value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="mental-health">Mental Health</SelectItem>
                <SelectItem value="meditation">Meditation</SelectItem>
                <SelectItem value="anxiety">Anxiety</SelectItem>
                <SelectItem value="stress">Stress</SelectItem>
                <SelectItem value="sleep">Sleep</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setFilters({ search: '', category: 'all' })}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-32 w-full mb-2" />
                    <Skeleton className="h-3 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : content.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No content found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {content.map((item) => (
                <Card
                  key={item.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setSelectedContent(item);
                    setShowModal(true);
                  }}
                >
                  {item.imageUrl && (
                    <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                      <img
                        src={item.imageUrl}
                        alt={item.title || 'Content image'}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      <Badge variant="outline">{item.type || 'Content'}</Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {item.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-amber-600">
                        <Star className="h-3 w-3 fill-current" />
                        <span>{item.rating || 0}</span>
                        <span className="text-muted-foreground">({item.reviewCount || 0})</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {item.category || 'Uncategorized'}
                      </Badge>
                    </div>
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(item);
                        }}
                      >
                        <Edit className="mr-2 h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteContent(item.id);
                        }}
                      >
                        <Trash2 className="mr-2 h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedContent?.title || 'Content Details'}</DialogTitle>
            <DialogDescription>View and manage content information</DialogDescription>
          </DialogHeader>
          {selectedContent && (
            <div className="space-y-4">
              {selectedContent.imageUrl && (
                <img
                  src={selectedContent.imageUrl}
                  alt={selectedContent.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <p className="mt-1">
                    <Badge>{selectedContent.type || 'Content'}</Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <p className="mt-1 text-sm">{selectedContent.category || 'Uncategorized'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Rating</Label>
                  <p className="mt-1 text-sm flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    {selectedContent.rating || 0} ({selectedContent.reviewCount || 0} reviews)
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Created</Label>
                  <p className="mt-1 text-sm">
                    {selectedContent.createdAt
                      ? new Date(selectedContent.createdAt).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <p className="mt-1 text-sm leading-relaxed">
                  {selectedContent.description || 'No description provided'}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Close
            </Button>
            <Button variant="outline" onClick={() => handleEditClick(selectedContent)}>
              Edit
            </Button>
            <Button variant="destructive" onClick={() => handleDeleteContent(selectedContent?.id)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ContentForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleFormSubmit}
        initialData={editingItem}
      />

      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <Alert variant={toast.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>{toast.message}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
