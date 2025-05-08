import React from 'react';

const posts = [
  {
    id: 1,
    title: 'Local Cleanup Drive this Saturday',
    message: 'Join hands with neighbours to clean up our local park area and enjoy refreshments after!',
  },
  {
    id: 2,
    title: 'Free Grocery for Seniors',
    message: 'A community-led grocery support initiative is live. Volunteers needed!',
  },
  {
    id: 3,
    title: 'Summer BBQ & Game Night',
    message: 'Come celebrate the season with a neighbourhood cookout and activities for all ages.',
  },
];

export default function FeaturedPosts() {
  return (
    <section className="py-12 px-6 bg-white">
      <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-6">
        📣 Featured Posts
      </h2>
      <div className="flex flex-wrap justify-center gap-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-green-50 border border-green-200 rounded-lg shadow-md p-6 w-full max-w-sm"
          >
            <h3 className="text-lg font-semibold text-green-900 mb-2">{post.title}</h3>
            <p className="text-gray-700 text-sm mb-4">{post.message}</p>
            <a
              href="#"
              className="inline-block text-sm text-green-700 hover:underline font-medium"
            >
              Read more →
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
