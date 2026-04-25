'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import RouteGuard from '@/app/components/RouteGuard';
import { commentPost, createPost, getFeed, likePost } from '@/app/lib/api';

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
  const [commentText, setCommentText] = useState<Record<number, string>>({});

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
      setPosts((current) => [post, ...current]);
      setNewPost('');
    } catch (err) {
      alert('Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const result = await likePost(postId);
      setPosts((current) =>
        current.map((post) => {
          if (post.id !== postId) {
            return post;
          }

          const likes = Array.isArray(post.likes) ? post.likes : [];
          const nextLikes = result.liked
            ? [...likes, { userId: user?.id }]
            : likes.filter((like: any) => (like.userId ?? like.user?.id) !== user?.id);

          return { ...post, likes: nextLikes };
        }),
      );
    } catch (err) {
      console.error('Like failed', err);
    }
  };

  const handleComment = async (postId: number) => {
    const text = commentText[postId];
    if (!text?.trim()) return;

    try {
      const comments = await commentPost(postId, text);
      setPosts((current) =>
        current.map((post) => (post.id === postId ? { ...post, comments } : post)),
      );
      setCommentText((current) => ({ ...current, [postId]: '' }));
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
          {posts.map((post) => {
            const hasLiked = post.likes?.some((like: any) => (like.userId ?? like.user?.id) === user?.id);
            const profilePhoto =
              post.user?.photos?.find((photo: any) => photo.isProfile)?.url ||
              post.user?.photos?.[0]?.url ||
              '/logos/top-left-logo-for-website/CamConnect.png';

            return (
              <div key={post.id} style={{ background: 'var(--surface)', borderRadius: 16, padding: '1.5rem', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <img
                    src={profilePhoto}
                    alt=""
                    style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>{post.user?.username || 'Unknown'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {new Date(post.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>{post.content}</p>

                {post.photos?.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    {post.photos.map((photo: any) => (
                      <img key={photo.id} src={photo.url} alt="" style={{ maxWidth: 200, borderRadius: 8, objectFit: 'cover' }} />
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  <button
                    onClick={() => handleLike(post.id)}
                    style={{ background: 'none', border: 'none', color: hasLiked ? '#ef4444' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={hasLiked ? '#ef4444' : 'none'} stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    {post.likes?.length || 0}
                  </button>
                  <span>{post.comments?.length || 0} comments</span>
                </div>

                {post.comments?.length > 0 && (
                  <div style={{ marginBottom: '1rem', paddingLeft: '1rem', borderLeft: '2px solid var(--border)' }}>
                    {post.comments.map((comment: any) => (
                      <div key={comment.id} style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{comment.user?.username || 'Unknown'}: </span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{comment.content}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={commentText[post.id] || ''}
                    onChange={(e) => setCommentText((current) => ({ ...current, [post.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                    style={{ flex: 1, padding: '0.5rem 0.75rem', background: 'var(--surface-light)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
                  />
                  <button className="btn btn-small btn-primary" onClick={() => handleComment(post.id)}>
                    Comment
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
