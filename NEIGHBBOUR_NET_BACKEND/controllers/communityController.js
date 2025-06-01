const Community = require('../models/Community');

// Create a new community
const createCommunity = async (req, res) => {
  try {
    const { name, street, postal, description, image, userId } = req.body;

    const newComm = new Community({
      name,
      street,
      postal,
      description,
      image,
      creator: userId,
      members: [userId]
    });

    await newComm.save();
    res.json(newComm);
  } catch (err) {
    res.status(500).json({ message: 'Error creating community', error: err.message });
  }
};

// Get all global communities
const getAllCommunities = async (req, res) => {
  try {
    const communities = await Community.find().populate('creator', 'name');
    res.json(communities);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching communities', error: err.message });
  }
};

// Join a community
const joinCommunity = async (req, res) => {
  try {
    const { userId } = req.body;
    const comm = await Community.findById(req.params.id);

    if (!comm.members.includes(userId)) {
      comm.members.push(userId);
      await comm.save();
    }

    res.json({ message: 'Joined community' });
  } catch (err) {
    res.status(500).json({ message: 'Error joining community', error: err.message });
  }
};

// Get communities for a user
const getUserCommunities = async (req, res) => {
  try {
    const userId = req.params.userId;

    const created = await Community.find({ creator: userId });
    const joined = await Community.find({
      members: userId,
      creator: { $ne: userId }
    });

    res.json({ created, joined });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user communities', error: err.message });
  }
};

// Get single community detail
const getCommunityById = async (req, res) => {
  try {
    const comm = await Community.findById(req.params.id).populate('members', 'name email');
    if (!comm) return res.status(404).json({ message: 'Community not found' });
    res.json(comm);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching community', error: err.message });
  }
};

// Leave a community
const leaveCommunity = async (req, res) => {
  try {
    const { userId } = req.body;
    const comm = await Community.findById(req.params.id);

    comm.members = comm.members.filter(id => id.toString() !== userId);
    await comm.save();

    res.json({ message: 'Left community' });
  } catch (err) {
    res.status(500).json({ message: 'Error leaving community', error: err.message });
  }
};

// Delete a community (if user is creator)
const deleteCommunity = async (req, res) => {
  try {
    const { userId } = req.body;
    const comm = await Community.findById(req.params.id);

    if (comm.creator.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete' });
    }

    await comm.deleteOne();
    res.json({ message: 'Community deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting community', error: err.message });
  }
};

module.exports = {
  createCommunity,
  getAllCommunities,
  joinCommunity,
  getUserCommunities,
  getCommunityById,
  leaveCommunity,
  deleteCommunity
};
