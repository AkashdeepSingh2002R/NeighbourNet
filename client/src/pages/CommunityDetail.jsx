import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';

export default function CommunityDetail() {
  const { id } = useParams(); // community ID
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [preview, setPreview] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    api.get('/communities/${id}')
      .then(res => setCommunity(res.data))
      .catch(err => {
        console.error('Community not found:', err);
        setCommunity(null);
      });

    api.get('/community-posts/${id}')
      .then(res => setPosts(res.data))
      .catch(() => setPosts([]));
  }, [id]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    const payload = {
      userId: user._id,
      name: user.name,
      message: newPost,
      image: preview || '',
      communityId: id
    };

    const res = await api.post('/community-posts', payload);
    setPosts([res.data, ...posts]);
    setNewPost('');
    setPreview(null);
  };

  if (!community) return <div className="p-10 text-center text-lg">Community not found.</div>;

  return (
    <div className="min-h-screen bg-[#f1f3ec] text-[#2f4235]">
      

      <div className="max-w-4xl mx-auto px-6 py-10 bg-white rounded shadow-md mt-6">
        <img
          src={community.image}
          alt={community.name}
          className="w-full h-64 object-cover rounded mb-4"
        />
        <h2 className="text-3xl font-bold text-[#2f4430]">{community.name}</h2>
        <p className="text-sm text-[#5f705e] mt-1">
          {community.street}, {community.postal}
        </p>
        <p className="mt-4 text-[#3a4e38] text-base">{community.description}</p>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-[#2f4430] mb-2">Members</h3>
          {community.members.length === 0 ? (
            <p className="text-sm text-gray-500">No members yet</p>
          ) : (
            <ul className="list-disc ml-6 text-sm">
              {community.members.map((member) => (
                <li key={member._id}>{member.name}</li>
              ))}
            </ul>
          )}
        </div>

        <hr className="my-6" />

        {/* Post Form */}
        <form onSubmit={handlePost} className="space-y-3 mb-8">
          <textarea
            rows="3"
            placeholder="Share something with the community..."
            className="w-full p-2 border rounded resize-none text-sm"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
          />
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {preview && <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded" />}
          <button type="submit" className="bg-[#d4e7ba] px-4 py-2 rounded font-semibold text-sm">
            Post
          </button>
        </form>

        {/* Post Feed */}
        <h3 className="text-lg font-semibold text-[#2f4430] mb-2">Posts</h3>
        {posts.length === 0 ? (
          <p className="text-sm text-gray-500">No posts yet.</p>
        ) : (
          posts.map(post => (
            <div key={post._id} className="bg-[#f9f9f3] p-4 rounded-lg shadow mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">{post.name}</h4>
                <span className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm">{post.message}</p>
              {post.image && <img src={post.image} alt="Post" className="w-full rounded mt-2" />}
            </div>
          ))
        )}

        <Link to="/communities" className="inline-block mt-6 text-sm text-[#325a42] underline">
          ← Back to Communities
        </Link>
      </div>

      
    </div>
  );
}
