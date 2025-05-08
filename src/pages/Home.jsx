import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WeatherHero from '../components/WeatherHero';
import ActionTiles from '../components/ActionTiles';

const initialPosts = [
  {
    id: 1,
    name: 'Alice',
    time: '2h ago',
    message: 'Had a great walk this morning in the park.',
    image: '',
    likes: 3,
    comments: ['So true!']
  }
];

const neighborsData = [
  { id: 1, name: 'Charlie', bio: 'Gardener', image: '/profiles/charlie.jpg' },
  { id: 2, name: 'Dana', bio: 'Baker', image: '/profiles/dana.jpg' },
  { id: 3, name: 'Eva', bio: 'Dog walker', image: '/profiles/eva.jpg' }
];

// ✅ Accept onLogout prop
export default function Home({ onLogout }) {
  const [posts, setPosts] = useState(initialPosts);
  const [newPost, setNewPost] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [commentInput, setCommentInput] = useState({});
  const [editingPostId, setEditingPostId] = useState(null);
  const [editedMessage, setEditedMessage] = useState('');

  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);

  const handleLike = (id) => {
    setPosts(posts.map(post =>
      post.id === id ? { ...post, likes: post.likes + 1 } : post
    ));
  };

  const handlePost = (e) => {
    e.preventDefault();
    if (newPost.trim()) {
      const newEntry = {
        id: Date.now(),
        name: 'You',
        time: 'Just now',
        message: newPost,
        image: preview,
        likes: 0,
        comments: []
      };
      setPosts([newEntry, ...posts]);
      setNewPost('');
      setPreview(null);
      setNewImage(null);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      setNewImage(file);
    }
  };

  const handleComment = (postId) => {
    const comment = commentInput[postId]?.trim();
    if (comment) {
      setPosts(posts.map(post =>
        post.id === postId
          ? { ...post, comments: [...post.comments, comment] }
          : post
      ));
      setCommentInput({ ...commentInput, [postId]: '' });
    }
  };

  const startEdit = (post) => {
    setEditingPostId(post.id);
    setEditedMessage(post.message);
  };

  const saveEdit = (id) => {
    setPosts(posts.map(post =>
      post.id === id ? { ...post, message: editedMessage } : post
    ));
    setEditingPostId(null);
    setEditedMessage('');
  };

  const deletePost = (id) => {
    setPosts(posts.filter(post => post.id !== id));
  };

  const sendRequest = (neighbor) => {
    if (!sentRequests.includes(neighbor.id) && !friends.find(f => f.id === neighbor.id)) {
      setFriendRequests([...friendRequests, neighbor]);
      setSentRequests([...sentRequests, neighbor.id]);
    }
  };

  const acceptRequest = (id) => {
    const accepted = friendRequests.find(f => f.id === id);
    setFriends([...friends, accepted]);
    setFriendRequests(friendRequests.filter(f => f.id !== id));
  };

  const ignoreRequest = (id) => {
    setFriendRequests(friendRequests.filter(f => f.id !== id));
  };

  const isFriend = (id) => friends.some(f => f.id === id);

  return (
    <div className="min-h-screen bg-[#f1f3ec] text-[#2f4235]">
      {/* ✅ Pass onLogout to Navbar */}
      <Navbar onLogout={onLogout} />
      <WeatherHero />
      <ActionTiles />

      <main className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-8">
        {/* Feed Section */}
        <section className="flex-1 space-y-6">
          <form onSubmit={handlePost} className="bg-white p-4 rounded shadow space-y-2">
            <textarea
              rows="3"
              placeholder="Share something..."
              className="w-full p-2 border rounded resize-none text-sm"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
            />
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {preview && <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded" />}
            <button type="submit" className="bg-[#d4e7ba] px-4 py-2 rounded font-semibold text-sm">Post</button>
          </form>

          {posts.map(post => (
            <div key={post.id} className="bg-white p-4 rounded-lg shadow space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">{post.name}</h3>
                <span className="text-xs text-gray-500">{post.time}</span>
              </div>
              {editingPostId === post.id ? (
                <>
                  <textarea rows="2" className="w-full p-1 border rounded text-sm" value={editedMessage} onChange={(e) => setEditedMessage(e.target.value)} />
                  <button onClick={() => saveEdit(post.id)} className="text-xs text-blue-700 mr-2">Save</button>
                  <button onClick={() => setEditingPostId(null)} className="text-xs text-gray-500">Cancel</button>
                </>
              ) : (
                <>
                  <p className="text-sm">{post.message}</p>
                  {post.image && <img src={post.image} alt="Post" className="w-full rounded mt-2" />}
                </>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <button onClick={() => handleLike(post.id)}>❤️ {post.likes} Likes</button>
                <span>💬 {post.comments.length} Comments</span>
              </div>
              {post.name === 'You' && editingPostId !== post.id && (
                <div className="flex gap-2 text-xs text-blue-600">
                  <button onClick={() => startEdit(post)}>Edit</button>
                  <button onClick={() => deletePost(post.id)} className="text-red-500">Delete</button>
                </div>
              )}
              <div className="space-y-1 mt-2 text-sm">
                {post.comments.map((c, i) => <p key={i}>💬 {c}</p>)}
              </div>
              <div className="flex gap-2 mt-1">
                <input type="text" placeholder="Comment..." className="flex-1 p-1 border rounded text-sm"
                  value={commentInput[post.id] || ''}
                  onChange={(e) => setCommentInput({ ...commentInput, [post.id]: e.target.value })}
                />
                <button onClick={() => handleComment(post.id)} className="text-xs bg-[#f5ca4e] px-3 py-1 rounded">Comment</button>
              </div>
            </div>
          ))}
        </section>

        {/* Sidebar */}
        <aside className="w-full md:w-[300px] space-y-6">
          {/* Friend Requests */}
          <div className="bg-[#fff8dc] p-4 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-3">Friend Requests</h3>
            {friendRequests.length === 0 ? (
              <p className="text-sm text-gray-500">No pending requests</p>
            ) : (
              <ul className="space-y-4">
                {friendRequests.map((req) => (
                  <li key={req.id} className="flex items-center gap-3">
                    <img src={req.image} alt={req.name} className="w-10 h-10 rounded-full object-cover border" />
                    <div className="flex-1">
                      <p className="font-medium">{req.name}</p>
                      <p className="text-xs text-gray-600">{req.bio}</p>
                    </div>
                    <div className="space-x-1">
                      <button onClick={() => acceptRequest(req.id)} className="text-xs bg-green-200 px-2 py-1 rounded">Accept</button>
                      <button onClick={() => ignoreRequest(req.id)} className="text-xs bg-red-200 px-2 py-1 rounded">Ignore</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* People Nearby */}
          <div className="bg-[#f6fadd] p-4 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-3">People Nearby</h3>
            <ul className="space-y-4">
              {neighborsData.map((person) => (
                <li key={person.id} className="flex items-center gap-3">
                  <img src={person.image} alt={person.name} className="w-12 h-12 rounded-full object-cover border" />
                  <div className="flex-1">
                    <p className="font-medium">{person.name}</p>
                    <p className="text-xs text-gray-600">{person.bio}</p>
                  </div>
                  <button
                    className="text-xs bg-[#d4e7ba] px-3 py-1 rounded text-[#2f4235]"
                    onClick={() => sendRequest(person)}
                    disabled={sentRequests.includes(person.id) || isFriend(person.id)}
                  >
                    {isFriend(person.id) ? "Friend" : sentRequests.includes(person.id) ? "Requested" : "Add"}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Friends List */}
          <div className="bg-[#e6f7ff] p-4 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-3">Your Friends</h3>
            {friends.length === 0 ? (
              <p className="text-sm text-gray-500">You haven't added any friends yet</p>
            ) : (
              <ul className="space-y-4">
                {friends.map((friend) => (
                  <li key={friend.id} className="flex items-center gap-3">
                    <img src={friend.image} alt={friend.name} className="w-10 h-10 rounded-full object-cover border" />
                    <div className="flex-1">
                      <p className="font-medium">{friend.name}</p>
                      <p className="text-xs text-gray-600">{friend.bio}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </main>

      <Footer />
    </div>
  );
}
