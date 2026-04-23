'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import RouteGuard from '@/app/components/RouteGuard';
import { getFeed, createPost, likePost, commentPost } from '@/app/lib/api';

export default function FeedPage() {
  return (
    <RouteGuard>
      <FeedContent />
    </RouteGuard>
  );
}

function FeedContent() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [commentText, setCommentText] = useState<Record<string, string>>({});

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      const data = await getFeed();
      setPosts(data || []);
    } catch (err) {
      console.error('Failed to load feed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      const post = await createPost(newPost);
      setPosts([post, ...posts]);
      setNewPost('');
    } catch (err) {
      alert('Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const result = await likePost(postId);
      setPosts(posts.map(p => {
        if (p._id === postId) {
          return { ...p, likes: result.liked ? [...p.likes, { _id: user?._id }] : p.likes.filter((l: any) => l._id !== user?._id) };
        }
        return p;
      }));
    } catch (err) {
      console.error('Like failed', err);
    }
  };

  const handleComment = async (postId: string) => {
    const text = commentText[postId];
    if (!text?.trim()) return;
    try {
      const comments = await commentPost(postId, text);
      setPosts(posts.map(p => {
        if (p._id === postId) {
          return { ...p, comments };
        }
        return p;
      }));
      setCommentText({ ...commentText, [postId]: '' });
    } catch (err) {
      alert('Failed to comment');
    }
  };

  return (
    <main style={{ paddingTop: 100, maxWidth: 800, margin: '0 auto', paddingLeft: 20, paddingRight: 20 }}>
      <h1 style={{ marginBottom: '2rem' }}>Feed</h1>

      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--border)' }}>
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <textarea
            rows={3}
            placeholder="What's on your mind?"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={handleCreatePost} disabled={posting}>
            {posting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Loading posts...</p>
      ) : posts.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No posts yet. Be the first!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {posts.map((post) => (
            <div key={post._id} style={{ background: 'var(--surface)', borderRadius: 16, padding: '1.5rem', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <img
                  src={post.userId?.photos?.[0] || '/logos/top-left-logo-for-website/CamConnect.png'}
                  alt=""
                  style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>{post.userId?.username || 'Unknown'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {new Date(post.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>{post.content}</p>

              {post.photos?.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  {post.photos.map((photo: string, i: number) => (
                    <img key={i} src={photo} alt="" style={{ maxWidth: 200, borderRadius: 8, objectFit: 'cover' }} />
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                <button
                  onClick={() => handleLike(post._id)}
                  style={{ background: 'none', border: 'none', color: post.likes?.some((l: any) => l._id === user?._id) ? '#ef4444' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={post.likes?.some((l: any) => l._id === user?._id) ? '#ef4444' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {post.likes?.length || 0}
                </button>
                <span>{post.comments?.length || 0} comments</span>
              </div>

              {post.comments?.length > 0 && (
                <div style={{ marginBottom: '1rem', paddingLeft: '1rem', borderLeft: '2px solid var(--border)' }}>
                  {post.comments.map((comment: any, i: number) => (
                    <div key={i} style={{ marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{comment.userId?.username || 'Unknown'}: </span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{comment.content}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={commentText[post._id] || ''}
                  onChange={(e) => setCommentText({ ...commentText, [post._id]: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment(post._id)}
                  style={{ flex: 1, padding: '0.5rem 0.75rem', background: 'var(--surface-light)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
                />
                <button className="btn btn-small btn-primary" onClick={() => handleComment(post._id)}>
                  Comment
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
